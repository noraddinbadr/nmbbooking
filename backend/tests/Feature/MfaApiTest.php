<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Identity\Models\MfaFactor;
use Illuminate\Support\Str;
use OTPHP\TOTP;
use Tests\TestCase;

final class MfaApiTest extends TestCase
{
    public function test_enabled_totp_requires_an_mfa_challenge_before_a_new_api_token_is_issued(): void
    {
        config()->set('platform.allow_self_registration', true);
        $email = 'mfa-api-'.Str::lower(Str::random(12)).'@example.test';
        $password = 'VerySecurePassword1';

        $this->postJson('/api/platform/auth/register', [
            'name' => 'MFA API User',
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ])->assertCreated();

        $initialLogin = $this->postJson('/api/platform/auth/login', [
            'email' => $email,
            'password' => $password,
        ])->assertOk();
        $initialToken = (string) $initialLogin->json('data.token');

        $setup = $this->withToken($initialToken)
            ->postJson('/api/platform/mfa/totp/prepare')
            ->assertCreated()
            ->assertJsonPath('data.provisioning_uri', fn (string $uri): bool => str_starts_with($uri, 'otpauth://totp/'));
        $factorPublicId = (string) $setup->json('data.factor_public_id');
        $factor = MfaFactor::query()->where('public_id', $factorPublicId)->firstOrFail();
        $totp = TOTP::createFromSecret($factor->secret_encrypted);

        $this->withToken($initialToken)
            ->postJson('/api/platform/mfa/totp/confirm', [
                'factor_public_id' => $factorPublicId,
                'code' => $totp->now(),
            ])
            ->assertOk()
            ->assertJsonCount(10, 'data.recovery_codes');

        app('auth')->forgetGuards();
        $challengeLogin = $this->postJson('/api/platform/auth/login', [
            'email' => $email,
            'password' => $password,
        ])->assertStatus(202)
            ->assertJsonPath('data.requires_mfa', true);
        $challenge = (string) $challengeLogin->json('data.challenge');

        $this->postJson('/api/platform/auth/mfa/verify', [
            'challenge' => $challenge,
            'code' => $totp->now(),
            'device_name' => 'mfa-test-device',
        ])->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.email', $email);

        self::assertInstanceOf(User::class, User::query()->where('email', $email)->first());
    }
}
