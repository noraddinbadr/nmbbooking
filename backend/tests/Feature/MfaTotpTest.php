<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Identity\Models\MfaFactor;
use App\Modules\Identity\Services\MfaTotpService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use OTPHP\TOTP;
use Tests\TestCase;

final class MfaTotpTest extends TestCase
{
    public function test_totp_enrollment_recovery_code_consumption_and_disable_are_secure(): void
    {
        $user = User::query()->create([
            'name' => 'MFA User',
            'email' => 'mfa-'.Str::lower(Str::random(12)).'@example.test',
            'password' => Hash::make('VerySecurePassword1'),
            'status' => 'active',
        ]);
        $service = app(MfaTotpService::class);

        $setup = $service->begin($user);
        $factor = $setup['factor'];
        self::assertStringStartsWith('otpauth://totp/', $setup['provisioning_uri']);
        self::assertNotSame(
            $factor->secret_encrypted,
            (string) DB::connection('platform')->table('mfa_factors')->where('id', $factor->id)->value('secret_encrypted'),
        );

        $totp = TOTP::createFromSecret($factor->secret_encrypted);
        $recoveryCodes = $service->confirm($user, $factor->public_id, $totp->now());
        self::assertCount(10, $recoveryCodes);
        self::assertTrue($service->requiresMfa($user));

        self::assertTrue($service->verify($user, $recoveryCodes[0]));
        self::assertFalse($service->verify($user, $recoveryCodes[0]));

        $service->disable($user, $totp->now());
        self::assertFalse($service->requiresMfa($user));
        self::assertNotNull(MfaFactor::query()->findOrFail($factor->id)->disabled_at);
    }
}
