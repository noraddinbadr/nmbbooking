<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Modules\Content\Models\Page;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageRevision;
use App\Modules\Content\Services\ReorderPageBlocksAction;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class ReorderPageBlocksActionTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_draft_blocks_reorder_atomically_and_reject_incomplete_orders(): void
    {
        $context = $this->context();
        $site = Site::query()->where('public_id', $context->sitePublicId)->firstOrFail();
        $page = Page::query()->where('site_id', $site->id)->where('route_path', '/')->firstOrFail();
        $revision = PageRevision::query()->create([
            'page_id' => $page->id,
            'revision_no' => (int) $page->revisions()->max('revision_no') + 1,
            'template_key' => 'reorder.v1',
            'status' => 'draft',
            'created_by_platform_user_id' => 1,
        ]);
        $blocks = collect([
            ['hero.split', '2.1.0', 'industrial-dark'],
            ['services.grid', '1.0.0', 'cards'],
            ['hero.split', '2.1.0', 'industrial-dark'],
        ])->map(function (array $component, int $index) use ($revision): PageBlock {
            return PageBlock::query()->create([
                'page_revision_id' => $revision->id,
                'public_id' => Str::ulid()->toBase32(),
                'component_key' => $component[0],
                'component_version' => $component[1],
                'position' => ($index + 1) * 10,
                'enabled' => true,
                'variant_key' => $component[2],
                'props_json' => $component[0] === 'services.grid'
                    ? ['heading' => 'خدمات', 'items' => []]
                    : ['title' => 'عنوان', 'subtitle' => '', 'cta' => ['label' => 'اتصل', 'href' => '/contact']],
                'style_json' => [],
                'visibility_rules_json' => [],
                'lock_version' => 1,
            ]);
        });
        $orderedIds = $blocks->reverse()->pluck('public_id')->values()->all();

        $reordered = app(ReorderPageBlocksAction::class)->execute($revision, $orderedIds, 1);
        self::assertSame($orderedIds, $reordered->blocks->pluck('public_id')->all());
        self::assertSame([10, 20, 30], $reordered->blocks->pluck('position')->all());

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('contain each revision block exactly once');
        app(ReorderPageBlocksAction::class)->execute($revision, array_slice($orderedIds, 1), 1);
    }

    private function context(): TenantContext
    {
        $context = app(AddressResolver::class)->resolve(Request::create('http://acme.localhost/'));
        self::assertInstanceOf(TenantContext::class, $context);
        app(TenantDatabaseManager::class)->activate($context);

        return $context;
    }
}
