<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property int $user_id
 * @property int $role_id
 * @property string $status
 * @property-read Tenant $tenant
 * @property-read User $user
 */
final class TenantMembership extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'tenant_id',
        'user_id',
        'role_id',
        'status',
        'accepted_at',
    ];

    protected function casts(): array
    {
        return ['accepted_at' => 'immutable_datetime'];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
