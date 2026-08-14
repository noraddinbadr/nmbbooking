<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Modules\Tenancy\Models\TenantDatabase;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Throwable;

final class MigrateTenantDatabases extends Command
{
    protected $signature = 'tenants:migrate
        {--tenant= : Tenant slug to migrate; omit to process all ready tenants sequentially}
        {--release=dev : Release version recorded in tenant_migration_runs}
        {--pretend : Report selected tenants without applying migrations}';

    protected $description = 'Run tenant schema migrations sequentially and record each tenant migration run.';

    public function handle(): int
    {
        $query = TenantDatabase::query()
            ->with('tenant')
            ->where('status', 'ready')
            ->whereHas('tenant', fn ($tenantQuery) => $tenantQuery->where('status', 'active'))
            ->orderBy('id');

        if (is_string($this->option('tenant')) && $this->option('tenant') !== '') {
            $query->whereHas('tenant', fn ($tenantQuery) => $tenantQuery->where('slug', $this->option('tenant')));
        }

        $databases = $query->get();
        if ($databases->isEmpty()) {
            $this->warn('No ready tenant databases matched the selection.');

            return self::SUCCESS;
        }

        foreach ($databases as $database) {
            $this->line("Tenant [{$database->tenant->slug}] → {$database->database_name}");
            if ((bool) $this->option('pretend')) {
                continue;
            }

            $runId = DB::connection('platform')->table('tenant_migration_runs')->insertGetId([
                'tenant_id' => $database->tenant_id,
                'release_version' => (string) $this->option('release'),
                'status' => 'running',
                'migrations_json' => json_encode([], JSON_THROW_ON_ERROR),
                'started_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            try {
                $this->configureMigratorConnection($database);
                Artisan::call('migrate', [
                    '--database' => (string) config('platform.tenant_migrations_connection_name'),
                    '--path' => 'database/tenant/migrations',
                    '--force' => true,
                ]);

                $output = Artisan::output();
                DB::connection('platform')->table('tenant_migration_runs')->where('id', $runId)->update([
                    'status' => 'succeeded',
                    'migrations_json' => json_encode(['output' => $output], JSON_THROW_ON_ERROR),
                    'finished_at' => now(),
                    'updated_at' => now(),
                ]);
                DB::connection('platform')->table('tenant_databases')->where('id', $database->id)->update([
                    'schema_version' => (string) $this->option('release'),
                    'last_verified_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->info('  migrated successfully');
            } catch (Throwable $exception) {
                DB::connection('platform')->table('tenant_migration_runs')->where('id', $runId)->update([
                    'status' => 'failed',
                    'failure_reason' => mb_substr($exception->getMessage(), 0, 65535),
                    'finished_at' => now(),
                    'updated_at' => now(),
                ]);
                $this->error("  migration failed: {$exception->getMessage()}");

                return self::FAILURE;
            } finally {
                DB::disconnect((string) config('platform.tenant_migrations_connection_name'));
            }
        }

        return self::SUCCESS;
    }

    private function configureMigratorConnection(TenantDatabase $database): void
    {
        $references = (array) config('platform.tenant_migration_credentials', []);
        $credentialReference = $database->credential_ref.':migrator';
        $profile = $references[$credentialReference] ?? null;
        if (! is_array($profile) || ! is_string($profile['username'] ?? null) || ! is_string($profile['password'] ?? null)) {
            throw new \RuntimeException("Migrator credential is unavailable for [{$credentialReference}].");
        }

        $connectionName = (string) config('platform.tenant_migrations_connection_name');
        config()->set("database.connections.{$connectionName}", [
            ...config("database.connections.{$connectionName}"),
            'host' => $database->db_host,
            'port' => (int) $database->db_port,
            'database' => $database->database_name,
            'username' => $profile['username'],
            'password' => $profile['password'],
        ]);
        DB::purge($connectionName);
    }
}
