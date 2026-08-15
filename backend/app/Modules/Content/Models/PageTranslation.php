<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $page_id
 * @property int $site_id
 * @property string $locale
 * @property string $title
 * @property string $slug
 * @property array<string, mixed>|null $seo_json
 * @property-read Page $page
 */
final class PageTranslation extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'page_id',
        'site_id',
        'locale',
        'title',
        'slug',
        'seo_json',
    ];

    protected function casts(): array
    {
        return ['seo_json' => 'array'];
    }

    /** @return BelongsTo<Page, $this> */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
