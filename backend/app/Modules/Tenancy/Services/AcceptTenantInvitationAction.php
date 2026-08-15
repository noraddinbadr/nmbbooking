<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Models\User;
use App\Modules\Tenancy\Models\TenantInvitation;
use App\Modules\Tenancy\Models\TenantMembership;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class AcceptTenantInvitationAction
{
    public function execute(string $plainToken, User $user): TenantMembership
    {
        return DB::connection('platform')->transaction(function () use ($plainToken, $user): TenantMembership {
            $invitation = TenantInvitation::query()
                ->where('token_hash', hash('sha256', $plainToken))
                ->lockForUpdate()
                ->first();

            if (! $invitation instanceof TenantInvitation
                || $invitation->accepted_at !== null
                || $invitation->revoked_at !== null
                || $invitation->expires_at->isPast()
                || ! hash_equals($invitation->email, mb_strtolower($user->email))) {
                throw ValidationException::withMessages([
                    'token' => ['The invitation is invalid or expired.'],
                ]);
            }

            $membership = TenantMembership::query()->updateOrCreate(
                [
                    'tenant_id' => $invitation->tenant_id,
                    'user_id' => $user->id,
                ],
                [
                    'role_id' => $invitation->role_id,
                    'status' => 'active',
                    'accepted_at' => now(),
                ],
            );

            DB::connection('platform')
                ->table('membership_site_scopes')
                ->where('membership_id', $membership->id)
                ->delete();

            foreach ($invitation->site_scope_public_ids_json ?? [] as $sitePublicId) {
                DB::connection('platform')->table('membership_site_scopes')->insert([
                    'membership_id' => $membership->id,
                    'site_public_id' => $sitePublicId,
                ]);
            }

            $invitation->forceFill(['accepted_at' => now()])->save();

            return $membership;
        });
    }
}
