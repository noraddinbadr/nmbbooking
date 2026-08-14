<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use Illuminate\Database\DatabaseManager;
use RuntimeException;

final class TenantDatabaseManager
{
    public function __construct(private readonly DatabaseManager $database) {}

    public function activate(TenantContext $context): void
    {
        $connectionName = (string) config('platform.tenant_connection_name');
        $password = $this->passwordFor($context->credentialReference);

        config()->set("database.connections.{$connectionName}", [
            ...config("database.connections.{$connectionName}"),
            'host' => $context->databaseHost,
            'port' => $context->databasePort,
            'database' => $context->databaseName,
            'username' => $context->databaseUsername,
            'password' => $password,
        ]);

        $this->database->purge($connectionName);
        $this->database->reconnect($connectionName);
    }

    public function deactivate(): void
    {
        $this->database->disconnect((string) config('platform.tenant_connection_name'));
    }

    private function passwordFor(string $credentialReference): string
    {
        $credentials = (array) config('platform.tenant_credentials', []);
        $password = $credentials[$credentialReference] ?? null;

        if (! is_string($password) || $password === '') {
            throw new RuntimeException("Tenant database credential is unavailable for reference [{$credentialReference}].");
        }

        return $password;
    }
}
