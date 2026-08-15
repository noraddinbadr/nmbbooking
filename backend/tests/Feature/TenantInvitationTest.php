<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Shared\Mail\OutboundEmailMessage;
use App\Modules\Tenancy\Models\Role;
use App\Modules\Tenancy\Models\Tenant;
use App\Modules\Tenancy\Models\TenantInvitation;
use App\Modules\Tenancy\Services\AcceptTenantInvitationAction;
use App\Modules\Tenancy\Services\CreateTenantInvitationAction;
use Database\Seeders\AcmeConstructionSeeder;
use Database\Seeders\PlatformCatalogSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

final class TenantInvitationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PlatformCatalogSeeder::class);
        $this->seed(AcmeConstructionSeeder::class);
    }

    public function test_tenant_invitation_creates_a_scoped_active_membership_after_acceptance(): void
    {
        Mail::fake();
        $tenant = Tenant::query()->where('slug', 'acme')->firstOrFail();
        $role = Role::query()->where('key', 'site-editor')->firstOrFail();
        $actor = User::query()->where('email', 'owner@example.test')->firstOrFail();
        $sitePublicId = (string) DB::connection('platform')
            ->table('site_addresses')
            ->where('tenant_id', $tenant->id)
            ->value('site_public_id');
        $email = 'editor-'.Str::lower(Str::random(12)).'@example.test';

        $invitation = app(CreateTenantInvitationAction::class)->execute(
            tenant: $tenant,
            email: $email,
            roleId: $role->id,
            siteScopePublicIds: [$sitePublicId],
            actorUserId: $actor->id,
        );

        Mail::assertSent(OutboundEmailMessage::class, static fn (OutboundEmailMessage $message): bool => $message->hasTo($email));
        self::assertNotSame('', $invitation->token_hash);

        $invitedUser = User::query()->create([
            'name' => 'Tenant Editor',
            'email' => $email,
            'password' => Hash::make('VerySecurePassword1'),
            'status' => 'active',
        ]);

        $plainToken = null;
        Mail::assertSent(OutboundEmailMessage::class, static function (OutboundEmailMessage $message) use (&$plainToken): bool {
            preg_match('#/invite/([^"\'<\s]+)#', $message->email->html, $matches);
            $plainToken = $matches[1] ?? null;

            return is_string($plainToken) && $plainToken !== '';
        });

        $membership = app(AcceptTenantInvitationAction::class)->execute((string) $plainToken, $invitedUser);

        self::assertSame('active', $membership->status);
        self::assertSame($tenant->id, $membership->tenant_id);
        self::assertSame($role->id, $membership->role_id);
        self::assertNotNull(TenantInvitation::query()->findOrFail($invitation->id)->accepted_at);
        $this->assertDatabaseHas('membership_site_scopes', [
            'membership_id' => $membership->id,
            'site_public_id' => $sitePublicId,
        ], 'platform');
    }
}
