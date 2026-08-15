<?php

declare(strict_types=1);

namespace Tests\Feature;

use Illuminate\Support\Str;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

final class PlatformAuthTest extends TestCase
{
    public function test_registration_login_authenticated_profile_and_logout_work_with_a_revocable_token(): void
    {
        config()->set('platform.allow_self_registration', true);
        $email = 'platform-'.Str::lower(Str::random(12)).'@example.test';
        $password = 'VerySecurePassword1';

        $this->postJson('/api/platform/auth/register', [
            'name' => 'Platform User',
            'email' => $email,
            'password' => $password,
            'password_confirmation' => $password,
        ])->assertCreated()
            ->assertJsonPath('data.email', $email)
            ->assertJsonPath('data.status', 'active');

        $login = $this->postJson('/api/platform/auth/login', [
            'email' => $email,
            'password' => $password,
            'device_name' => 'test-device',
        ])->assertOk()
            ->assertJsonPath('data.token_type', 'Bearer')
            ->assertJsonPath('data.user.email', $email);

        $token = (string) $login->json('data.token');
        self::assertNotSame('', $token);
        $tokenRecord = PersonalAccessToken::findToken($token);
        self::assertInstanceOf(PersonalAccessToken::class, $tokenRecord);

        $this->withToken($token)
            ->getJson('/api/platform/me')
            ->assertOk()
            ->assertJsonPath('data.email', $email);

        $this->withToken($token)
            ->postJson('/api/platform/logout')
            ->assertNoContent();

        self::assertNull(PersonalAccessToken::findToken($token));
        app('auth')->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/platform/me')
            ->assertUnauthorized();
    }

    public function test_self_registration_is_hidden_when_the_capability_is_disabled(): void
    {
        config()->set('platform.allow_self_registration', false);

        $this->postJson('/api/platform/auth/register', [
            'name' => 'Blocked User',
            'email' => 'blocked@example.test',
            'password' => 'VerySecurePassword1',
            'password_confirmation' => 'VerySecurePassword1',
        ])->assertNotFound();
    }
}
