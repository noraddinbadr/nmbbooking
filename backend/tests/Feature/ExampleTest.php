<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Services\ApprovePageRevisionAction;
use App\Modules\Content\Services\PublishPageRevisionAction;
use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Packages\Services\ActivatePackageAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

final class ExampleTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_a_verified_tenant_host_renders_its_published_page(): void
    {
        $response = $this->get('http://acme.localhost/?lang=ar');

        $response->assertOk();
        $response->assertSee('شركة Acme للمقاولات');
        $response->assertSee('نبني مشاريع تصمد أمام الزمن');
    }

    public function test_verified_address_resolution_caches_only_the_resolved_tenant_context(): void
    {
        $request = Request::create('http://acme.localhost/');
        $cacheKey = 'tenant-context:'.hash('sha256', "acme.localhost\n/");
        $cache = app(CacheRepository::class);
        $cache->forget($cacheKey);

        $resolvedContext = app(AddressResolver::class)->resolve($request);
        $cachedContext = $cache->get($cacheKey);

        $this->assertInstanceOf(TenantContext::class, $resolvedContext);
        $this->assertInstanceOf(TenantContext::class, $cachedContext);
        $this->assertSame($resolvedContext->tenantPublicId, $cachedContext->tenantPublicId);
        $this->assertSame($resolvedContext->sitePublicId, $cachedContext->sitePublicId);
    }

    public function test_an_unknown_host_cannot_select_or_render_a_tenant(): void
    {
        $this->get('http://unknown.localhost/')
            ->assertNotFound();
    }

    public function test_platform_owner_can_access_the_single_admin_dashboard(): void
    {
        $owner = User::query()->where('email', 'owner@example.test')->firstOrFail();

        $this->actingAs($owner, 'backpack')
            ->get('/admin/platform')
            ->assertOk()
            ->assertSee('تشغيل المنصة');
    }

    public function test_reviewer_approval_and_publish_atomically_move_the_public_revision(): void
    {
        $request = Request::create('http://acme.localhost/');
        $context = app(AddressResolver::class)->resolve($request);
        $this->assertNotNull($context);
        app(TenantDatabaseManager::class)->activate($context);

        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $nextRevision = (int) $page->revisions()->max('revision_no') + 1;
        $revision = PageRevision::query()->create([
            'page_id' => $page->id,
            'revision_no' => $nextRevision,
            'template_key' => 'construction.home.v1',
            'status' => 'in_review',
            'created_by_platform_user_id' => 1,
        ]);
        PageBlock::query()->create([
            'page_revision_id' => $revision->id,
            'public_id' => Str::ulid()->toBase32(),
            'component_key' => 'hero.split',
            'component_version' => '2.1.0',
            'position' => 10,
            'enabled' => true,
            'variant_key' => 'industrial-dark',
            'props_json' => ['title' => 'مراجعة منشورة', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
            'style_json' => [],
            'visibility_rules_json' => [],
        ]);

        $approved = app(ApprovePageRevisionAction::class)->execute($revision, 1);
        $published = app(PublishPageRevisionAction::class)->execute($approved, 1);

        $this->assertSame('published', $published->status);
        $this->assertSame($published->id, $page->fresh()->published_revision_id);
        $this->assertTrue(PageRevision::query()->whereKey($published->id)->where('status', 'published')->exists());
    }

    public function test_entitled_sector_package_activates_without_runtime_migration(): void
    {
        $request = Request::create('http://acme.localhost/');
        $context = app(AddressResolver::class)->resolve($request);
        $this->assertNotNull($context);
        app(TenantDatabaseManager::class)->activate($context);

        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $activation = app(ActivatePackageAction::class)->execute(
            context: $context,
            packageKey: 'logistics.fleet',
            site: $site,
            config: ['showVehicleCount' => true],
            actorPlatformUserId: 1,
        );

        $this->assertSame('active', $activation->status);
        $this->assertTrue(PackageActivation::query()
            ->where('package_key', 'logistics.fleet')
            ->where('site_id', $site->id)
            ->where('status', 'active')
            ->exists());
        $this->assertTrue(DB::connection((string) config('platform.tenant_connection_name'))
            ->table('audit_events')
            ->where('event_key', 'package.activated')
            ->where('metadata_json', 'like', '%logistics.fleet%')
            ->exists());
    }
}
