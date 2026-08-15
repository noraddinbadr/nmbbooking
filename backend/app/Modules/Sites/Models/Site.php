<?php

declare(strict_types=1);

namespace App\Modules\Sites\Models;

use App\Modules\Content\Models\Page;
use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $public_id
 * @property string $name
 * @property string $code
 * @property string $default_locale
 * @property string $status
 * @property int $published_content_version
 * @property-read Collection<int, SiteLocale> $locales
 * @property-read Collection<int, Page> $pages
 */
final class Site extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'public_id',
        'name',
        'code',
        'default_locale',
        'status',
        'published_content_version',
    ];

    /** @return HasMany<SiteLocale, $this> */
    public function locales(): HasMany
    {
        return $this->hasMany(SiteLocale::class);
    }

    /** @return HasMany<Page, $this> */
    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }
}
