<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Models\User;
use App\Modules\Components\Services\ComponentRegistry;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class PublishPageRevisionAction
{
    public function __construct(
        private readonly ComponentRegistry $components,
        private readonly ContentPublicationAuthorizer $authorizer,
    ) {}

    public function executeAuthorized(PageRevision $revision, User $actor, TenantContext $context): PageRevision
    {
        $revision->loadMissing('page.site');
        $this->authorizer->assertAllows($actor, $context, $revision->page->site, 'site:pages:publish');

        return $this->execute($revision, $actor->id);
    }

    public function execute(PageRevision $revision, int $actorPlatformUserId): PageRevision
    {
        if (! in_array($revision->status, ['approved', 'scheduled'], true)) {
            throw new RuntimeException('Only an approved or scheduled revision may be published.');
        }

        $revision->loadMissing(['page.site', 'blocks']);
        $page = $revision->page;
        $site = $page->site;
        $this->assertBlocksCanPublish($revision, $site);

        DB::connection((string) config('platform.tenant_connection_name'))->transaction(function () use ($revision, $page, $site, $actorPlatformUserId): void {
            PageRevision::query()
                ->where('page_id', $page->id)
                ->where('status', 'published')
                ->whereKeyNot($revision->id)
                ->update(['status' => 'superseded', 'updated_at' => now()]);

            $revision->forceFill([
                'status' => 'published',
                'published_by_platform_user_id' => $actorPlatformUserId,
                'published_at' => now(),
            ])->save();

            $page->forceFill([
                'status' => 'published',
                'published_revision_id' => $revision->id,
            ])->save();

            $site->increment('published_content_version');

            DB::connection((string) config('platform.tenant_connection_name'))
                ->table('audit_events')
                ->insert([
                    'actor_platform_user_id' => $actorPlatformUserId,
                    'event_key' => 'content.page-revision-published',
                    'subject_type' => 'page_revision',
                    'subject_public_id' => $page->public_id,
                    'metadata_json' => json_encode(['revisionId' => $revision->id], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                ]);
        });

        Cache::forget("tenant:site:{$site->public_id}:published-content");

        return $revision->fresh();
    }

    private function assertBlocksCanPublish(PageRevision $revision, Site $site): void
    {
        $activePackages = PackageActivation::query()
            ->where('status', 'active')
            ->where(function ($query) use ($site): void {
                $query->where(function ($nested): void {
                    $nested->where('scope_type', 'tenant')->whereNull('site_id');
                })->orWhere(function ($nested) use ($site): void {
                    $nested->where('scope_type', 'site')->where('site_id', $site->id);
                });
            })
            ->pluck('package_key')
            ->flip();

        foreach ($revision->blocks as $block) {
            if (! $block->enabled) {
                continue;
            }

            $manifest = $this->components->require($block->component_key, $block->component_version);
            foreach ($manifest['requiredPackages'] ?? [] as $packageKey) {
                if (! $activePackages->has($packageKey)) {
                    throw new RuntimeException("Block [{$block->public_id}] requires inactive package [{$packageKey}].");
                }
            }
        }
    }
}
