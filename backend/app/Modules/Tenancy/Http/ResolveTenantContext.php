<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Http;

use App\Modules\Tenancy\Services\AddressResolver;
use App\Modules\Tenancy\Services\TenantContext;
use App\Modules\Tenancy\Services\TenantDatabaseManager;
use Closure;
use Illuminate\Http\Request;
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

        try {
            return $next($request);
        } finally {
            $this->databaseManager->deactivate();
        }
    }
}
