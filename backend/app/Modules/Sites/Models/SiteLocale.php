<?php

declare(strict_types=1);

namespace App\Modules\Sites\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class SiteLocale extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'site_id',
        'locale',
        'direction',
        'is_default',
        'status',
    ];

    protected function casts(): array
    {
        return ['is_default' => 'boolean'];
    }

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }
}
