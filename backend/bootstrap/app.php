<?php

use App\Modules\Shared\Http\ApplySecurityHeaders;
use App\Modules\Shared\Http\EnsureCorrelationId;
use App\Modules\Shared\Http\RequireInternalHealthAccess;
use App\Modules\Tenancy\Http\ResolveTenantContext;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->append(EnsureCorrelationId::class);
        $middleware->append(ApplySecurityHeaders::class);

        $middleware->alias([
            'internal.health' => RequireInternalHealthAccess::class,
            'tenant.resolve' => ResolveTenantContext::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $expectsApiResponse = static fn (Request $request): bool => $request->is('api/*') || $request->expectsJson();

        $exceptions->shouldRenderJsonWhen($expectsApiResponse);

        $exceptions->render(function (ValidationException $exception, Request $request) use ($expectsApiResponse): ?JsonResponse {
            if (! $expectsApiResponse($request)) {
                return null;
            }

            return response()->json([
                'error' => [
                    'code' => 'validation_failed',
                    'message' => 'The submitted data is invalid.',
                    'fields' => $exception->errors(),
                ],
                'meta' => ['request_id' => (string) $request->attributes->get('request_id')],
            ], $exception->status);
        });

        $exceptions->render(function (HttpExceptionInterface $exception, Request $request) use ($expectsApiResponse): ?JsonResponse {
            if (! $expectsApiResponse($request)) {
                return null;
            }

            $status = $exception->getStatusCode();
            $messages = [
                400 => 'The request is invalid.',
                401 => 'Authentication is required.',
                403 => 'You are not allowed to perform this action.',
                404 => 'The requested resource was not found.',
                405 => 'The request method is not allowed.',
                429 => 'Too many requests. Please retry later.',
            ];

            return response()->json([
                'error' => [
                    'code' => $status === 404 ? 'not_found' : 'request_failed',
                    'message' => $messages[$status] ?? 'The request could not be completed.',
                ],
                'meta' => ['request_id' => (string) $request->attributes->get('request_id')],
            ], $status, $exception->getHeaders());
        });
    })->create();
