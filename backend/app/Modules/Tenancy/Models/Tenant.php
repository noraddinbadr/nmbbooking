<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * @property int $id
 * @property string $public_id
 * @property string $name
 * @property string $slug
 * @property string $status
 * @property string $data_placement
 * @property string $timezone
 * @property-read TenantDatabase|null $database
 */
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

    /** @return HasOne<TenantDatabase, $this> */
    public function database(): HasOne
    {
        return $this->hasOne(TenantDatabase::class);
    }
}
