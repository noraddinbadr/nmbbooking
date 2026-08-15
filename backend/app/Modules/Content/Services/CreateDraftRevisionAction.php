<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageBlockTranslation;
use App\Modules\Content\Models\PageRevision;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class CreateDraftRevisionAction
{
    public function execute(Page $page, int $actorPlatformUserId, ?string $changeNote = null): PageRevision
    {
        return DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($page, $actorPlatformUserId, $changeNote): PageRevision {
                $lockedPage = Page::query()->whereKey($page->id)->lockForUpdate()->firstOrFail();
                if ($lockedPage->published_revision_id === null) {
                    throw new RuntimeException('A draft revision can only be created from a published page revision.');
                }

                $source = PageRevision::query()
                    ->with('blocks.translations')
                    ->whereKey($lockedPage->published_revision_id)
                    ->where('page_id', $lockedPage->id)
                    ->where('status', 'published')
                    ->firstOrFail();
                $draft = PageRevision::query()->create([
                    'page_id' => $lockedPage->id,
                    'revision_no' => (int) PageRevision::query()->where('page_id', $lockedPage->id)->max('revision_no') + 1,
                    'template_key' => $source->template_key,
                    'status' => 'draft',
                    'created_by_platform_user_id' => $actorPlatformUserId,
                    'change_note' => $changeNote,
                ]);

                foreach ($source->blocks as $sourceBlock) {
                    $block = PageBlock::query()->create([
                        'page_revision_id' => $draft->id,
                        'public_id' => Str::ulid()->toBase32(),
                        'component_key' => $sourceBlock->component_key,
                        'component_version' => $sourceBlock->component_version,
                        'position' => $sourceBlock->position,
                        'enabled' => $sourceBlock->enabled,
                        'variant_key' => $sourceBlock->variant_key,
                        'props_json' => $sourceBlock->props_json,
                        'style_json' => $sourceBlock->style_json,
                        'visibility_rules_json' => $sourceBlock->visibility_rules_json,
                        'lock_version' => 1,
                    ]);

                    foreach ($sourceBlock->translations as $translation) {
                        PageBlockTranslation::query()->create([
                            'page_block_id' => $block->id,
                            'locale' => $translation->locale,
                            'props_json' => $translation->props_json,
                        ]);
                    }
                }

                DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
                    'actor_platform_user_id' => $actorPlatformUserId,
                    'event_key' => 'content.page-revision-drafted',
                    'subject_type' => 'page_revision',
                    'subject_public_id' => $lockedPage->public_id,
                    'metadata_json' => json_encode(['sourceRevisionId' => $source->id, 'draftRevisionId' => $draft->id], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                ]);

                return $draft->fresh('blocks.translations');
            },
        );
    }
}
