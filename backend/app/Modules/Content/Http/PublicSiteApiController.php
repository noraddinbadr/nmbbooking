<?php

declare(strict_types=1);

namespace App\Modules\Content\Http;

use App\Modules\Content\Services\RenderPublishedPageAction;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final class PublicSiteApiController
{
    public function __invoke(Request $request, RenderPublishedPageAction $render, string $path = ''): JsonResponse
    {
        /** @var TenantContext $context */
        $context = $request->attributes->get(TenantContext::class);
        $routePath = '/'.trim($path, '/');
        $page = $render->execute($request, $context, $routePath === '/' ? '/' : $routePath);

        return response()->json([
            'apiVersion' => 'v1',
            'site' => [
                'publicId' => $page['site']->public_id,
                'name' => $page['site']->name,
                'locale' => $page['locale'],
                'direction' => $page['direction'],
            ],
            'page' => [
                'publicId' => $page['page']->public_id,
                'routePath' => $page['page']->route_path,
                'title' => $page['title'],
                'seo' => $page['seo'],
                'blocks' => collect($page['blocks'])->map(static fn (array $block): array => [
                    'publicId' => $block['publicId'],
                    'componentKey' => $block['componentKey'],
                    'componentVersion' => $block['componentVersion'],
                    'variant' => $block['variant'],
                    'props' => $block['props'],
                    'style' => $block['style'],
                ])->values(),
            ],
        ]);
    }
}
