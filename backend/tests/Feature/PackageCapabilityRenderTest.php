<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Models\PageTranslation;
use App\Modules\Content\Services\RenderPublishedPageAction;
use App\Modules\Packages\Services\DisablePackageAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PackageCapabilityRenderTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_disabling_a_package_hides_its_published_blocks_without_breaking_the_page(): void
    {
        $request = Request::create('http://acme.localhost/package-capability');
        $context = app(AddressResolver::class)->resolve($request);
        self::assertNotNull($context);
        app(TenantDatabaseManager::class)->activate($context);
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $routePath = '/package-capability-'.Str::lower(Str::random(12));
        $slug = ltrim($routePath, '/');

        $page = Page::query()->create([
            'site_id' => $site->id,
            'public_id' => Str::ulid()->toBase32(),
            'route_path' => $routePath,
            'page_type' => 'standard',
            'status' => 'published',
        ]);
        $revision = PageRevision::query()->create([
            'page_id' => $page->id,
            'revision_no' => 1,
            'template_key' => 'package-capability.v1',
            'status' => 'published',
            'created_by_platform_user_id' => 1,
            'published_by_platform_user_id' => 1,
            'published_at' => now(),
        ]);
        $page->forceFill(['published_revision_id' => $revision->id])->save();
        PageTranslation::query()->create([
            'page_id' => $page->id,
            'site_id' => $site->id,
            'locale' => 'ar',
            'title' => 'اختبار الحزم',
            'slug' => $slug,
            'seo_json' => [],
        ]);
        PageBlock::query()->create([
            'page_revision_id' => $revision->id,
            'public_id' => Str::ulid()->toBase32(),
            'component_key' => 'projects.grid',
            'component_version' => '1.0.0',
            'position' => 10,
            'enabled' => true,
            'variant_key' => 'showcase',
            'props_json' => ['heading' => 'مشروعات', 'limit' => 6],
            'style_json' => [],
            'visibility_rules_json' => [],
        ]);

        self::assertCount(1, app(RenderPublishedPageAction::class)->execute($request, $context, $routePath)['blocks']);

        app(DisablePackageAction::class)->execute($context, 'construction.projects', $site, 1);

        self::assertSame([], app(RenderPublishedPageAction::class)->execute($request, $context, $routePath)['blocks']);
    }
}
