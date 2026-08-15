<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

final class PasswordResetTest extends TestCase
{
    public function test_password_reset_uses_platform_broker_and_invalidates_the_old_password(): void
    {
        $email = 'reset-'.Str::lower(Str::random(12)).'@example.test';
        $oldPassword = 'VerySecurePassword1';
        $newPassword = 'AnotherSecurePassword2';
        $user = User::query()->create([
            'name' => 'Reset User',
            'email' => $email,
            'password' => Hash::make($oldPassword),
            'status' => 'active',
        ]);
        Notification::fake();

        $this->postJson('/api/platform/auth/password/forgot', ['email' => $email])
            ->assertNoContent();

        $token = null;
        Notification::assertSentTo($user, ResetPassword::class, static function (ResetPassword $notification) use (&$token): bool {
            $token = $notification->token;

            return true;
        });
        self::assertIsString($token);

        $resetResponse = $this->postJson('/api/platform/auth/password/reset', [
            'email' => $email,
            'token' => $token,
            'password' => $newPassword,
            'password_confirmation' => $newPassword,
        ]);
        $resetResponse->assertNoContent();

        self::assertTrue(Hash::check($newPassword, $user->fresh()->password));
        $this->postJson('/api/platform/auth/login', ['email' => $email, 'password' => $oldPassword])
            ->assertUnprocessable();
        $this->postJson('/api/platform/auth/login', ['email' => $email, 'password' => $newPassword])
            ->assertOk();
    }
}
