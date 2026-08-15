<?php

declare(strict_types=1);

namespace App\Modules\Identity\Services;

use App\Models\User;
use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final readonly class MfaLoginChallengeService
{
    public function __construct(private CacheRepository $cache) {}

    public function create(User $user): string
    {
        $challenge = Str::random(64);
        $this->cache->put(
            $this->cacheKey($challenge),
            ['user_id' => $user->id],
            now()->addMinutes(5),
        );

        return $challenge;
    }

    public function resolve(string $challenge): User
    {
        $payload = $this->cache->get($this->cacheKey($challenge));
        $userId = is_array($payload) ? $payload['user_id'] ?? null : null;
        $user = is_int($userId) ? User::query()->find($userId) : null;

        if (! $user instanceof User || $user->status !== 'active') {
            throw ValidationException::withMessages([
                'challenge' => ['The MFA challenge is invalid or expired.'],
            ]);
        }

        return $user;
    }

    public function consume(string $challenge): void
    {
        $this->cache->forget($this->cacheKey($challenge));
    }

    private function cacheKey(string $challenge): string
    {
        return 'mfa-login-challenge:'.hash('sha256', $challenge);
    }
}
