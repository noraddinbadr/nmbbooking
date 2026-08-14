<?php

declare(strict_types=1);

namespace App\Modules\Packages\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use App\Modules\Sites\Models\Site;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class PackageActivation extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'package_key',
        'package_version',
        'scope_type',
        'site_id',
        'status',
        'config_json',
        'enabled_by_platform_user_id',
        'enabled_at',
        'disabled_at',
    ];

    protected function casts(): array
    {
        return [
            'config_json' => 'array',
            'enabled_at' => 'immutable_datetime',
            'disabled_at' => 'immutable_datetime',
        ];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
