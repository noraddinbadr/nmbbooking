<?php

declare(strict_types=1);

namespace App\Modules\Shared\Http;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnforcePlatformHostPolicy
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->protectsPath($request) && ! $this->isAllowed($request->getHost())) {
            abort(404);
        }

        return $next($request);
    }

    private function protectsPath(Request $request): bool
    {
        return $request->is('admin', 'admin/*', 'api/platform', 'api/platform/*', 'api/internal', 'api/internal/*');
    }

    private function isAllowed(string $host): bool
    {
        $allowedHosts = array_values(array_filter(array_map(
            static fn (string $allowedHost): string => strtolower(trim($allowedHost)),
            explode(',', (string) config('platform.allowed_hosts')),
        )));

        if ($allowedHosts === []) {
            return true;
        }

        $host = strtolower(rtrim($host, '.'));

        foreach ($allowedHosts as $allowedHost) {
            if ($host === $allowedHost) {
                return true;
            }

            if (str_starts_with($allowedHost, '*.') && str_ends_with($host, substr($allowedHost, 1))) {
                return true;
            }
        }

        return false;
    }
}
