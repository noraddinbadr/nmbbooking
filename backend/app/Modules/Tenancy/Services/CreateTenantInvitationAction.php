<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Modules\Shared\Mail\EmailDispatcher;
use App\Modules\Shared\Mail\OutboundEmail;
use App\Modules\Tenancy\Models\Role;
use App\Modules\Tenancy\Models\Tenant;
use App\Modules\Tenancy\Models\TenantInvitation;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

final readonly class CreateTenantInvitationAction
{
    public function __construct(private EmailDispatcher $emailDispatcher) {}

    /**
     * @param  array<int, string>  $siteScopePublicIds
     */
    public function execute(
        Tenant $tenant,
        string $email,
        int $roleId,
        array $siteScopePublicIds,
        int $actorUserId,
    ): TenantInvitation {
        $normalizedEmail = mb_strtolower(trim($email));
        $normalizedScopes = $this->normalizeSiteScopes($siteScopePublicIds);
        $plainToken = Str::random(64);

        $invitation = DB::connection('platform')->transaction(function () use (
            $tenant,
            $normalizedEmail,
            $roleId,
            $normalizedScopes,
            $actorUserId,
            $plainToken,
        ): TenantInvitation {
            $role = Role::query()
                ->whereKey($roleId)
                ->whereIn('scope', ['tenant', 'site'])
                ->firstOrFail();

            if ($role->scope === 'site' && $normalizedScopes === []) {
                throw new InvalidArgumentException('A site role requires at least one site scope.');
            }

            TenantInvitation::query()
                ->where('tenant_id', $tenant->id)
                ->where('email', $normalizedEmail)
                ->whereNull('accepted_at')
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            return TenantInvitation::query()->create([
                'public_id' => Str::ulid()->toBase32(),
                'tenant_id' => $tenant->id,
                'role_id' => $role->id,
                'invited_by_user_id' => $actorUserId,
                'email' => $normalizedEmail,
                'token_hash' => hash('sha256', $plainToken),
                'site_scope_public_ids_json' => $normalizedScopes,
                'expires_at' => now()->addDays(7),
            ]);
        });

        $acceptanceUrl = rtrim((string) config('app.url'), '/').'/invite/'.$plainToken;
        $this->emailDispatcher->send(new OutboundEmail(
            recipient: $normalizedEmail,
            subject: 'You have been invited to a business site workspace',
            html: '<p>You have been invited to a business site workspace.</p><p><a href="'.e($acceptanceUrl).'">Accept invitation</a></p>',
            text: "You have been invited to a business site workspace. Accept invitation: {$acceptanceUrl}",
        ));

        return $invitation;
    }

    /**
     * @param  array<int, string>  $siteScopePublicIds
     * @return array<int, string>
     */
    private function normalizeSiteScopes(array $siteScopePublicIds): array
    {
        $scopes = array_values(array_unique($siteScopePublicIds));

        foreach ($scopes as $scope) {
            if (! is_string($scope) || ! Str::isUlid($scope)) {
                throw new InvalidArgumentException('Each site scope must be a ULID.');
            }
        }

        return $scopes;
    }
}
