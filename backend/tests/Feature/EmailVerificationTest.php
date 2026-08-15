<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

final class EmailVerificationTest extends TestCase
{
    public function test_signed_email_verification_marks_only_the_matching_platform_user_as_verified(): void
    {
        $user = User::query()->create([
            'name' => 'Verification User',
            'email' => 'verify-'.Str::lower(Str::random(12)).'@example.test',
            'password' => Hash::make('VerySecurePassword1'),
            'status' => 'active',
        ]);
        $token = $user->createToken('verification-test', ['platform:read'])->plainTextToken;
        Notification::fake();

        $this->withToken($token)
            ->postJson('/api/platform/email/verification-notification')
            ->assertNoContent();
        Notification::assertSentTo($user, VerifyEmail::class);

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(30),
            ['id' => $user->id, 'hash' => sha1($user->getEmailForVerification())],
        );

        $this->getJson($verificationUrl)->assertNoContent();
        self::assertNotNull($user->fresh()->email_verified_at);
    }
}
