<?php

declare(strict_types=1);

namespace App\Modules\Identity\Services;

use App\Models\User;
use App\Modules\Identity\Models\MfaFactor;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use OTPHP\TOTP;

final class MfaTotpService
{
    /**
     * @return array{factor: MfaFactor, provisioning_uri: string}
     */
    public function begin(User $user): array
    {
        MfaFactor::query()
            ->where('user_id', $user->id)
            ->where('type', 'totp')
            ->whereNull('verified_at')
            ->delete();

        $totp = TOTP::generate();
        $totp->setIssuer((string) config('app.name'));
        $totp->setLabel($user->email);

        $factor = MfaFactor::query()->create([
            'user_id' => $user->id,
            'public_id' => Str::ulid()->toBase32(),
            'type' => 'totp',
            'secret_encrypted' => $totp->getSecret(),
        ]);

        return [
            'factor' => $factor,
            'provisioning_uri' => $totp->getProvisioningUri(),
        ];
    }

    /**
     * @return array<int, string>
     */
    public function confirm(User $user, string $factorPublicId, string $code): array
    {
        $factor = MfaFactor::query()
            ->where('user_id', $user->id)
            ->where('public_id', $factorPublicId)
            ->where('type', 'totp')
            ->whereNull('disabled_at')
            ->whereNull('verified_at')
            ->firstOrFail();

        if (! $this->totpFor($factor)->verify($code, leeway: 29)) {
            throw ValidationException::withMessages(['code' => ['The authentication code is invalid.']]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();
        $factor->forceFill([
            'verified_at' => now(),
            'last_used_at' => now(),
            'recovery_codes_encrypted' => array_map(static fn (string $recoveryCode): string => Hash::make($recoveryCode), $recoveryCodes),
        ])->save();

        return $recoveryCodes;
    }

    public function verify(User $user, string $code): bool
    {
        $factor = MfaFactor::query()
            ->where('user_id', $user->id)
            ->where('type', 'totp')
            ->whereNotNull('verified_at')
            ->whereNull('disabled_at')
            ->first();

        if (! $factor instanceof MfaFactor) {
            return false;
        }

        if ($this->totpFor($factor)->verify($code, leeway: 29)) {
            $factor->forceFill(['last_used_at' => now()])->save();

            return true;
        }

        $recoveryCodeHashes = $factor->recovery_codes_encrypted ?? [];
        foreach ($recoveryCodeHashes as $index => $hash) {
            if (Hash::check($code, $hash)) {
                unset($recoveryCodeHashes[$index]);
                $factor->forceFill([
                    'last_used_at' => now(),
                    'recovery_codes_encrypted' => array_values($recoveryCodeHashes),
                ])->save();

                return true;
            }
        }

        return false;
    }

    public function disable(User $user, string $code): void
    {
        if (! $this->verify($user, $code)) {
            throw ValidationException::withMessages(['code' => ['The authentication code is invalid.']]);
        }

        MfaFactor::query()
            ->where('user_id', $user->id)
            ->where('type', 'totp')
            ->whereNull('disabled_at')
            ->update(['disabled_at' => now()]);
    }

    public function requiresMfa(User $user): bool
    {
        return MfaFactor::query()
            ->where('user_id', $user->id)
            ->where('type', 'totp')
            ->whereNotNull('verified_at')
            ->whereNull('disabled_at')
            ->exists();
    }

    private function totpFor(MfaFactor $factor): TOTP
    {
        return TOTP::createFromSecret($factor->secret_encrypted);
    }

    /** @return array<int, string> */
    private function generateRecoveryCodes(): array
    {
        return array_map(
            static fn (): string => Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4)),
            range(1, 10),
        );
    }
}
