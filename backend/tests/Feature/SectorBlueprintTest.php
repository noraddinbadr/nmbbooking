<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Packages\Models\PackageActivation;
use App\Modules\Packages\Services\ApplySectorBlueprintAction;
use App\Modules\Packages\Services\SectorBlueprintCatalog;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class SectorBlueprintTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_transport_and_mining_blueprints_are_available_with_safe_defaults(): void
    {
        $catalog = app(SectorBlueprintCatalog::class);
        $transport = $catalog->require('transport');
        $mining = $catalog->require('mining');

        self::assertSame('/coverage', $transport['templates'][2]['routePath']);
        self::assertSame('social.links', $transport['packages'][3]['packageKey']);
        self::assertSame('/sustainability', $mining['templates'][2]['routePath']);
        self::assertSame('analytics.config', $mining['packages'][3]['packageKey']);
    }

    public function test_blueprint_dry_run_is_non_mutating_and_apply_creates_drafts_and_activations(): void
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertNotNull($context);
        app(TenantDatabaseManager::class)->activate($context);
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        DB::connection('tenant')
            ->table('site_settings')
            ->where('site_id', $site->id)
            ->where('setting_key', 'sector.blueprint')
            ->delete();
        $action = app(ApplySectorBlueprintAction::class);

        $pagesBeforeDryRun = Page::query()->where('site_id', $site->id)->count();
        $dryRun = $action->execute($context, $site, 'logistics', 1, true);
        self::assertTrue($dryRun['dry_run']);
        self::assertContains('/fleet', $dryRun['pages']);
        self::assertSame($pagesBeforeDryRun, Page::query()->where('site_id', $site->id)->count());

        $report = $action->execute($context, $site, 'logistics', 1);
        self::assertFalse($report['dry_run']);
        self::assertTrue(Page::query()->where('site_id', $site->id)->where('route_path', '/fleet')->exists());
        self::assertTrue(PackageActivation::query()
            ->where('package_key', 'logistics.fleet')
            ->where('site_id', $site->id)
            ->where('status', 'active')
            ->exists());
        self::assertTrue(DB::connection('tenant')
            ->table('audit_events')
            ->where('event_key', 'sector.blueprint.applied')
            ->exists());
        $snapshot = json_decode((string) DB::connection('tenant')
            ->table('site_settings')
            ->where('site_id', $site->id)
            ->where('setting_key', 'sector.blueprint')
            ->value('value_json'), true, flags: JSON_THROW_ON_ERROR);
        self::assertSame('logistics', $snapshot['sector_key']);
        self::assertArrayHasKey('snapshot_checksum', $snapshot);
        self::assertSame('logistics', $snapshot['snapshot']['sectorKey']);

        $action->execute($context, $site, 'logistics', 1);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('snapshot is immutable');
        $action->execute($context, $site, 'solar-energy', 1);
    }
}
