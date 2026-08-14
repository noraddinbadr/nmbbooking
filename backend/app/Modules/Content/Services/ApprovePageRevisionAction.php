<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Content\Models\PageRevision;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class ApprovePageRevisionAction
{
    public function execute(PageRevision $revision, int $actorPlatformUserId): PageRevision
    {
        if ($revision->status !== 'in_review') {
            throw new RuntimeException('Only a revision in review can be approved.');
        }

        return DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($revision, $actorPlatformUserId): PageRevision {
                $revision->forceFill(['status' => 'approved'])->save();

                DB::connection((string) config('platform.tenant_connection_name'))
                    ->table('audit_events')
                    ->insert([
                        'actor_platform_user_id' => $actorPlatformUserId,
                        'event_key' => 'content.page-revision-approved',
                        'subject_type' => 'page_revision',
                        'subject_public_id' => $revision->page?->public_id,
                        'metadata_json' => json_encode(['revisionId' => $revision->id], JSON_THROW_ON_ERROR),
                        'created_at' => now(),
                    ]);

                return $revision->fresh();
            },
        );
    }
}
