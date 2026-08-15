<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use App\Modules\Sites\Models\Site;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $site_id
 * @property string $public_id
 * @property string $route_path
 * @property string $page_type
 * @property string $status
 * @property int|null $published_revision_id
 * @property-read Site $site
 * @property-read Collection<int, PageRevision> $revisions
 * @property-read Collection<int, PageTranslation> $translations
 */
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

    /** @return BelongsTo<Site, $this> */
    public function site(): BelongsTo
    {
        return $this->belongsTo(Site::class);
    }

    /** @return HasMany<PageRevision, $this> */
    public function revisions(): HasMany
    {
        return $this->hasMany(PageRevision::class);
    }

    /** @return HasMany<PageTranslation, $this> */
    public function translations(): HasMany
    {
        return $this->hasMany(PageTranslation::class);
    }
}
