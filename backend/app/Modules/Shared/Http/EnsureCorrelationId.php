<?php

declare(strict_types=1);

namespace App\Modules\Shared\Http;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

final class EnsureCorrelationId
{
    public const HEADER = 'X-Request-Id';

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $this->resolveRequestId($request);

        $request->attributes->set('request_id', $requestId);
        Log::withContext([
            'request_id' => $requestId,
            'request_method' => $request->method(),
            'request_path' => '/'.ltrim($request->path(), '/'),
        ]);

        $response = $next($request);
        $response->headers->set(self::HEADER, $requestId);

        return $response;
    }

    private function resolveRequestId(Request $request): string
    {
        $providedId = $request->headers->get(self::HEADER);

        if (is_string($providedId) && preg_match('/^[A-Za-z0-9][A-Za-z0-9._-]{7,63}$/', $providedId) === 1) {
            return $providedId;
        }

        return (string) Str::ulid();
    }
}
