<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class ReorderPageBlocksAction
{
    /** @param list<string> $orderedBlockPublicIds */
    public function execute(PageRevision $revision, array $orderedBlockPublicIds, int $actorPlatformUserId): PageRevision
    {
        return DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($revision, $orderedBlockPublicIds, $actorPlatformUserId): PageRevision {
                $lockedRevision = PageRevision::query()->whereKey($revision->id)->lockForUpdate()->firstOrFail();
                if ($lockedRevision->status !== 'draft') {
                    throw new RuntimeException('Only blocks in a draft revision can be reordered.');
                }

                $blocks = PageBlock::query()
                    ->where('page_revision_id', $lockedRevision->id)
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('public_id');
                $uniqueIds = array_values(array_unique($orderedBlockPublicIds));
                if (count($uniqueIds) !== $blocks->count() || count($uniqueIds) !== count($orderedBlockPublicIds)
                    || collect($uniqueIds)->diff($blocks->keys())->isNotEmpty()) {
                    throw new RuntimeException('Block reorder request must contain each revision block exactly once.');
                }

                if ((int) $blocks->max('position') > 50000) {
                    throw new RuntimeException('Block positions exceed the safe reorder range.');
                }

                PageBlock::query()
                    ->where('page_revision_id', $lockedRevision->id)
                    ->update(['position' => DB::raw('position + 10000')]);
                foreach ($orderedBlockPublicIds as $index => $publicId) {
                    PageBlock::query()
                        ->whereKey($blocks[$publicId]->id)
                        ->update(['position' => ($index + 1) * 10]);
                }

                DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
                    'actor_platform_user_id' => $actorPlatformUserId,
                    'event_key' => 'content.page-blocks.reordered',
                    'subject_type' => 'page_revision',
                    'subject_public_id' => null,
                    'metadata_json' => json_encode(['revisionId' => $lockedRevision->id, 'orderedBlockIds' => $orderedBlockPublicIds], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                ]);

                return PageRevision::query()->with('blocks')->findOrFail($lockedRevision->id);
            },
        );
    }
}
