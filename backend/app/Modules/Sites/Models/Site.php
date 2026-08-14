<?php

declare(strict_types=1);

namespace App\Modules\Sites\Models;

use App\Modules\Content\Models\Page;
use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function locales(): HasMany
    {
        return $this->hasMany(SiteLocale::class);
    }

    public function pages(): HasMany
    {
        return $this->hasMany(Page::class);
    }
}
