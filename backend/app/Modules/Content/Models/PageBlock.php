<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

final class PageBlock extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'page_revision_id',
        'public_id',
        'component_key',
        'component_version',
        'position',
        'enabled',
        'variant_key',
        'props_json',
        'style_json',
        'visibility_rules_json',
        'lock_version',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'props_json' => 'array',
            'style_json' => 'array',
            'visibility_rules_json' => 'array',
        ];
    }

    public function revision(): BelongsTo
    {
        return $this->belongsTo(PageRevision::class, 'page_revision_id');
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PageBlockTranslation::class);
    }
}
