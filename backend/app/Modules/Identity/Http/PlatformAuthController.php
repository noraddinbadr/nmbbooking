<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http;

use App\Models\User;
use App\Modules\Identity\Services\MfaLoginChallengeService;
use App\Modules\Identity\Services\MfaTotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password as PasswordBroker;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

final class PlatformAuthController
{
    public function __construct(
        private readonly MfaTotpService $mfaTotpService,
        private readonly MfaLoginChallengeService $mfaLoginChallengeService,
    ) {}

    public function register(Request $request): JsonResponse
    {
        abort_unless((bool) config('platform.allow_self_registration'), 404);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:160'],
            'email' => ['required', 'string', 'email:rfc', 'max:190', 'unique:platform.users,email'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ]);

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => mb_strtolower($data['email']),
            'password' => Hash::make($data['password']),
            'status' => 'active',
        ]);

        return response()->json([
            'data' => $this->userPayload($user),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);

        $user = User::query()
            ->where('email', mb_strtolower($data['email']))
            ->first();

        if (! $user instanceof User || $user->status !== 'active' || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($this->mfaTotpService->requiresMfa($user)) {
            return response()->json([
                'data' => [
                    'requires_mfa' => true,
                    'challenge' => $this->mfaLoginChallengeService->create($user),
                ],
            ], 202);
        }

        return response()->json(['data' => $this->authenticatedPayload($user, $data['device_name'] ?? 'platform-api')]);
    }

    public function sendPasswordResetLink(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
        ]);

        PasswordBroker::sendResetLink(['email' => mb_strtolower($data['email'])]);

        return response()->json(status: 204);
    }

    public function resetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()],
        ]);

        $status = PasswordBroker::reset(
            [
                'email' => mb_strtolower($data['email']),
                'password' => $data['password'],
                'token' => $data['token'],
            ],
            static function (User $user, string $password): void {
                $user->forceFill(['password' => Hash::make($password), 'remember_token' => null])->save();
                $user->tokens()->delete();
            },
        );

        if ($status !== PasswordBroker::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }

        return response()->json(status: 204);
    }

    public function completeMfaLogin(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge' => ['required', 'string', 'size:64'],
            'code' => ['required', 'string', 'max:32'],
            'device_name' => ['nullable', 'string', 'max:120'],
        ]);
        $user = $this->mfaLoginChallengeService->resolve($data['challenge']);

        if (! $this->mfaTotpService->verify($user, $data['code'])) {
            throw ValidationException::withMessages([
                'code' => ['The authentication code is invalid.'],
            ]);
        }

        $this->mfaLoginChallengeService->consume($data['challenge']);

        return response()->json(['data' => $this->authenticatedPayload($user, $data['device_name'] ?? 'platform-api')]);
    }

    public function sendEmailVerification(Request $request): JsonResponse
    {
        $user = $this->resolvedUser($request);

        if (! $user->hasVerifiedEmail()) {
            $user->sendEmailVerificationNotification();
        }

        return response()->json(status: 204);
    }

    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::query()->findOrFail($id);
        abort_unless(hash_equals(sha1($user->getEmailForVerification()), $hash), 403);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return response()->json(status: 204);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $this->resolvedUser($request);

        return response()->json(['data' => $this->userPayload($user)]);
    }

    public function logout(Request $request): JsonResponse
    {
        $this->resolvedUser($request);
        $token = $request->bearerToken();

        if (is_string($token) && $token !== '') {
            PersonalAccessToken::findToken($token)?->delete();
        }

        return response()->json(status: 204);
    }

    /**
     * @return array{token: string, token_type: string, user: array{public_id: string, name: string, email: string, status: string}}
     */
    private function authenticatedPayload(User $user, string $deviceName): array
    {
        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($deviceName, ['platform:read']);

        return [
            'token' => $token->plainTextToken,
            'token_type' => 'Bearer',
            'user' => $this->userPayload($user),
        ];
    }

    /**
     * @return array{public_id: string, name: string, email: string, status: string}
     */
    private function userPayload(User $user): array
    {
        return [
            'public_id' => $user->public_id,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
        ];
    }

    private function resolvedUser(Request $request): User
    {
        $user = $request->user();

        abort_unless($user instanceof User, 401);

        return $user;
    }
}
