<?php

declare(strict_types=1);

namespace App\Modules\Content\Http;

use App\Modules\Content\Services\RenderPublishedPageAction;
use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Http\Request;
use Illuminate\View\View;

final class PublicPageController
{
    public function __invoke(Request $request, RenderPublishedPageAction $render, string $path = ''): View
    {
        /** @var TenantContext $context */
        $context = $request->attributes->get(TenantContext::class);
        $routePath = '/'.trim($path, '/');
        $routePath = $routePath === '/' ? '/' : $routePath;

        $page = $render->execute($request, $context, $routePath);

        return view('public.page', $page);
    }
}
