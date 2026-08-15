<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

final class PlatformIdentitySchemaTest extends TestCase
{
    public function test_platform_identity_runtime_tables_exist_with_required_columns(): void
    {
        $schema = Schema::connection('platform');

        self::assertTrue($schema->hasTable('mfa_factors'));
        self::assertTrue($schema->hasTable('platform_sessions'));
        self::assertTrue($schema->hasColumns('mfa_factors', [
            'id',
            'user_id',
            'public_id',
            'type',
            'secret_encrypted',
            'recovery_codes_encrypted',
            'verified_at',
            'disabled_at',
        ]));
        self::assertTrue($schema->hasColumns('platform_sessions', [
            'id',
            'user_id',
            'ip_address',
            'user_agent',
            'payload',
            'last_activity',
        ]));
    }
}
