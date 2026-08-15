<?php

declare(strict_types=1);

namespace App\Modules\Shared\Http;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class RequireInternalHealthAccess
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->allowsUnauthenticatedLocalAccess()) {
            return $next($request);
        }

        $configuredToken = config('platform.internal_health_token');
        $providedToken = $request->header('X-Internal-Health-Token');

        if (! is_string($configuredToken) || $configuredToken === '' || ! is_string($providedToken) || ! hash_equals($configuredToken, $providedToken)) {
            abort(404);
        }

        return $next($request);
    }

    private function allowsUnauthenticatedLocalAccess(): bool
    {
        return app()->environment('local')
            && (bool) config('platform.allow_unauthenticated_internal_health_in_local');
    }
}
