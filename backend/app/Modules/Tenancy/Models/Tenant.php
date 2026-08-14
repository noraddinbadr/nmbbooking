<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

final class Tenant extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'public_id',
        'name',
        'slug',
        'status',
        'data_placement',
        'timezone',
    ];

    public function database(): HasOne
    {
        return $this->hasOne(TenantDatabase::class);
    }
}
