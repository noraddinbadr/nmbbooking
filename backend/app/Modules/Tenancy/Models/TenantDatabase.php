<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class TenantDatabase extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'tenant_id',
        'connection_key',
        'database_name',
        'db_host',
        'db_port',
        'db_username',
        'credential_ref',
        'schema_version',
        'status',
        'last_verified_at',
    ];

    protected function casts(): array
    {
        return [
            'last_verified_at' => 'immutable_datetime',
        ];
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
