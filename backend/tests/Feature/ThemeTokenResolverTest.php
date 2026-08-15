<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Services\ThemeTokenResolver;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Tests\TestCase;

final class ThemeTokenResolverTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_site_theme_tokens_inherit_from_catalog_and_reject_overrides_outside_policy(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $tenant = DB::connection('tenant');
        $tenant->table('site_theme_tokens')->where('site_id', $site->id)->delete();
        $tenant->table('site_settings')->updateOrInsert(
            ['site_id' => $site->id, 'setting_key' => 'sector.blueprint'],
            ['value_json' => json_encode(['theme' => ['themeKey' => 'industrial']], JSON_THROW_ON_ERROR), 'version' => 1, 'created_at' => now(), 'updated_at' => now()],
        );
        $tenant->table('site_theme_tokens')->updateOrInsert(
            ['site_id' => $site->id, 'token_key' => 'colors.brand'],
            ['token_value' => '#ef4444', 'version' => 1, 'created_at' => now(), 'updated_at' => now()],
        );

        $resolver = app(ThemeTokenResolver::class);
        $tokens = $resolver->resolve($site);
        self::assertSame('#ef4444', $tokens['colors.brand']);
        self::assertSame('#172554', $tokens['colors.ink']);
        self::assertSame('5rem', $tokens['spacing.section']);

        $tenant->table('site_theme_tokens')->updateOrInsert(
            ['site_id' => $site->id, 'token_key' => 'spacing.section'],
            ['token_value' => '10rem', 'version' => 1, 'created_at' => now(), 'updated_at' => now()],
        );

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('overrides non-permitted theme token [spacing.section]');
        $resolver->resolve($site);
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
