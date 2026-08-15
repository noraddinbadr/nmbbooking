<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

final class PlatformAuthController
{
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

        $user->forceFill(['last_login_at' => now()])->save();
        $token = $user->createToken($data['device_name'] ?? 'platform-api', ['platform:read']);

        return response()->json([
            'data' => [
                'token' => $token->plainTextToken,
                'token_type' => 'Bearer',
                'user' => $this->userPayload($user),
            ],
        ]);
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
