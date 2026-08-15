<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $tenant_id
 * @property string $site_public_id
 * @property string $address_type
 * @property string $hostname
 * @property string $path_prefix
 * @property bool $is_primary
 * @property string $status
 * @property-read Tenant $tenant
 */
final class SiteAddress extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'tenant_id',
        'site_public_id',
        'address_type',
        'hostname',
        'path_prefix',
        'is_primary',
        'status',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'is_primary' => 'boolean',
            'verified_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
