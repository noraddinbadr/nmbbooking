<?php

declare(strict_types=1);

namespace App\Modules\Shared\Http\Controllers;

use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Contracts\Config\Repository as ConfigRepository;
use Illuminate\Contracts\Filesystem\Factory as FilesystemFactory;
use Illuminate\Database\ConnectionResolverInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

final readonly class InternalHealthController
{
    public function __construct(
        private ConnectionResolverInterface $connections,
        private ConfigRepository $config,
        private FilesystemFactory $filesystems,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $checks = [
            'application' => $this->applicationCheck(),
            'platform_database' => $this->platformDatabaseCheck(),
            'cache' => $this->cacheCheck(),
            'storage' => $this->storageCheck(),
        ];

        if ($request->attributes->get(TenantContext::class) instanceof TenantContext) {
            $checks['tenant_database'] = $this->tenantDatabaseCheck();
        }

        $healthy = collect($checks)->every(
            static fn (array $check): bool => $check['status'] === 'ok',
        );

        return response()->json([
            'status' => $healthy ? 'ok' : 'degraded',
            'checks' => $checks,
            'meta' => [
                'request_id' => (string) $request->attributes->get('request_id'),
            ],
        ], $healthy ? 200 : 503);
    }

    /**
     * @return array{status: string}
     */
    private function applicationCheck(): array
    {
        return ['status' => 'ok'];
    }

    /**
     * @return array{status: string, connection?: string}
     */
    private function platformDatabaseCheck(): array
    {
        $connection = (string) $this->config->get('database.default');

        try {
            $this->connections->connection($connection)->select('SELECT 1');

            return ['status' => 'ok', 'connection' => $connection];
        } catch (Throwable) {
            return ['status' => 'failed'];
        }
    }

    /**
     * @return array{status: string, connection?: string}
     */
    private function tenantDatabaseCheck(): array
    {
        $connection = (string) $this->config->get('platform.tenant_connection_name');

        try {
            $this->connections->connection($connection)->select('SELECT 1');

            return ['status' => 'ok', 'connection' => $connection];
        } catch (Throwable) {
            return ['status' => 'failed'];
        }
    }

    /**
     * @return array{status: string, disk?: string}
     */
    private function storageCheck(): array
    {
        $diskName = 'temporary';
        $path = 'health/'.bin2hex(random_bytes(8));

        try {
            $disk = $this->filesystems->disk($diskName);

            if (! $disk->put($path, 'ok')) {
                return ['status' => 'failed'];
            }

            $healthy = $disk->get($path) === 'ok';
            $disk->delete($path);

            return $healthy
                ? ['status' => 'ok', 'disk' => $diskName]
                : ['status' => 'failed'];
        } catch (Throwable) {
            return ['status' => 'failed'];
        }
    }

    /**
     * @return array{status: string, driver?: string}
     */
    private function cacheCheck(): array
    {
        $driver = (string) $this->config->get('cache.default');

        try {
            $key = 'health:'.bin2hex(random_bytes(8));
            cache()->put($key, 'ok', now()->addMinute());
            $value = cache()->pull($key);

            return $value === 'ok'
                ? ['status' => 'ok', 'driver' => $driver]
                : ['status' => 'failed'];
        } catch (Throwable) {
            return ['status' => 'failed'];
        }
    }
}
