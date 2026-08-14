<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use App\Modules\Sites\Models\Site;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class Page extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'site_id',
        'public_id',
        'route_path',
        'page_type',
        'status',
        'published_revision_id',
    ];

    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }
}
