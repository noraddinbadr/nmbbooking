<?php

declare(strict_types=1);

return [
    'contracts_path' => env('PLATFORM_CONTRACTS_PATH', base_path('../contracts')),
    'allowed_platform_hosts' => array_values(array_filter(explode(',', (string) env('PLATFORM_ALLOWED_HOSTS', '')))),
    'platform_connection_name' => 'platform',
    'platform_migrations_connection_name' => env('PLATFORM_MIGRATIONS_CONNECTION', 'platform_migrator'),
    'tenant_connection_name' => 'tenant',
    'tenant_migrations_connection_name' => env('TENANT_MIGRATIONS_CONNECTION', 'tenant_migrator'),
    'tenant_cache_ttl_seconds' => (int) env('TENANT_CONTEXT_CACHE_TTL', 60),
    'default_locale' => env('PLATFORM_DEFAULT_LOCALE', 'ar'),
    'strict_contract_validation' => env('PLATFORM_STRICT_CONTRACT_VALIDATION', true),
    'content_security_policy' => env(
        'PLATFORM_CONTENT_SECURITY_POLICY',
        "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'",
    ),
    'internal_health_token' => env('INTERNAL_HEALTH_TOKEN'),
    'allow_unauthenticated_internal_health_in_local' => env('INTERNAL_HEALTH_ALLOW_UNAUTHENTICATED_LOCAL', true),
    'tenant_credentials' => json_decode((string) env('TENANT_CREDENTIALS_JSON', '{}'), true, flags: JSON_THROW_ON_ERROR),
    'tenant_migration_credentials' => json_decode((string) env('TENANT_MIGRATION_CREDENTIALS_JSON', '{}'), true, flags: JSON_THROW_ON_ERROR),
];
