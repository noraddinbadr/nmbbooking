<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageRevision;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class RollbackPageRevisionAction
{
    public function execute(Page $page, PageRevision $targetRevision, int $actorPlatformUserId): PageRevision
    {
        return DB::connection((string) config('platform.tenant_connection_name'))->transaction(function () use ($page, $targetRevision, $actorPlatformUserId): PageRevision {
            $lockedPage = Page::query()->with('site')->whereKey($page->id)->lockForUpdate()->firstOrFail();
            if ($targetRevision->page_id !== $lockedPage->id || ! in_array($targetRevision->status, ['published', 'superseded'], true)) {
                throw new RuntimeException('Rollback target must be a previously public revision of the same page.');
            }

            $currentId = $lockedPage->published_revision_id;
            if ($currentId === $targetRevision->id) {
                throw new RuntimeException('Rollback target is already the published revision.');
            }

            PageRevision::query()->whereKey($currentId)->update(['status' => 'superseded', 'updated_at' => now()]);
            $targetRevision->forceFill(['status' => 'published', 'published_at' => now(), 'published_by_platform_user_id' => $actorPlatformUserId])->save();
            $lockedPage->forceFill(['published_revision_id' => $targetRevision->id, 'status' => 'published'])->save();
            $lockedPage->site->increment('published_content_version');
            DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert(['actor_platform_user_id' => $actorPlatformUserId, 'event_key' => 'content.page-revision-rolled-back', 'subject_type' => 'page_revision', 'subject_public_id' => $lockedPage->public_id, 'metadata_json' => json_encode(['fromRevisionId' => $currentId, 'toRevisionId' => $targetRevision->id], JSON_THROW_ON_ERROR), 'created_at' => now()]);
            Cache::forget("tenant:site:{$lockedPage->site->public_id}:published-content");

            return $targetRevision->fresh();
        });
    }
}
