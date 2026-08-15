<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $public_id
 * @property int $tenant_id
 * @property int $role_id
 * @property int|null $invited_by_user_id
 * @property string $email
 * @property string $token_hash
 * @property array<int, string>|null $site_scope_public_ids_json
 * @property CarbonImmutable $expires_at
 * @property CarbonImmutable|null $accepted_at
 * @property CarbonImmutable|null $revoked_at
 * @property-read Tenant $tenant
 * @property-read User|null $invitedBy
 */
final class TenantInvitation extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'public_id',
        'tenant_id',
        'role_id',
        'invited_by_user_id',
        'email',
        'token_hash',
        'site_scope_public_ids_json',
        'expires_at',
        'accepted_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'site_scope_public_ids_json' => 'array',
            'expires_at' => 'immutable_datetime',
            'accepted_at' => 'immutable_datetime',
            'revoked_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return BelongsTo<User, $this> */
    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by_user_id');
    }
}
