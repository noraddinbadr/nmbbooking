<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Http;

use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

final class ResolveTenantContext
{
    public function __construct(
        private readonly AddressResolver $addressResolver,
        private readonly TenantDatabaseManager $databaseManager,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $context = $this->addressResolver->resolve($request);

        if (! $context instanceof TenantContext) {
            abort(404);
        }

        $this->databaseManager->activate($context);
        app()->instance(TenantContext::class, $context);
        $request->attributes->set(TenantContext::class, $context);
        Log::withContext([
            'tenant_public_id' => $context->tenantPublicId,
            'site_public_id' => $context->sitePublicId,
        ]);

        try {
            return $next($request);
        } finally {
            $this->databaseManager->deactivate();
        }
    }
}
