<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }
}
