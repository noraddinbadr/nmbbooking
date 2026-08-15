<?php

declare(strict_types=1);

namespace App\Modules\Content\Http;

use App\Modules\Content\Models\Page;
use App\Modules\Sites\Models\Site;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

final class PublicSeoController
{
    public function robots(Request $request): Response
    {
        /** @var TenantContext $context */
        $context = $request->attributes->get(TenantContext::class);
        $baseUrl = $request->getSchemeAndHttpHost();

        return response("User-agent: *\nAllow: /\nSitemap: {$baseUrl}/sitemap.xml\n", 200, ['Content-Type' => 'text/plain; charset=UTF-8']);
    }

    public function sitemap(Request $request): Response
    {
        /** @var TenantContext $context */
        $context = $request->attributes->get(TenantContext::class);
        $site = Site::query()->where('public_id', $context->sitePublicId)->where('status', 'active')->firstOrFail();
        $baseUrl = rtrim($request->getSchemeAndHttpHost(), '/');
        $urls = Page::query()
            ->where('site_id', $site->id)
            ->where('status', 'published')
            ->whereNotNull('published_revision_id')
            ->orderBy('route_path')
            ->get(['route_path', 'updated_at']);
        $xml = view('public.sitemap', ['baseUrl' => $baseUrl, 'pages' => $urls])->render();

        return response($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
