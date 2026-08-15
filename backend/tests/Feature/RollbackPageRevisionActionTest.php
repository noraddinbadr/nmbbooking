<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Services\RollbackPageRevisionAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class RollbackPageRevisionActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_rollback_restores_an_earlier_public_revision_with_audit(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $target = $page->revisions()->where('status', 'superseded')->first();
        if ($target === null) {
            $target = $page->revisions()->where('status', 'published')->firstOrFail();
            $current = PageRevision::query()->create(['page_id' => $page->id, 'revision_no' => $target->revision_no + 1, 'template_key' => $target->template_key, 'status' => 'published', 'created_by_platform_user_id' => 1]);
            $target->update(['status' => 'superseded']);
            $page->update(['published_revision_id' => $current->id]);
        }

        $rolledBack = app(RollbackPageRevisionAction::class)->execute($page, $target, 1);

        self::assertSame('published', $rolledBack->status);
        self::assertSame($target->id, $page->fresh()->published_revision_id);
        self::assertTrue(DB::connection('tenant')->table('audit_events')->where('event_key', 'content.page-revision-rolled-back')->exists());
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
