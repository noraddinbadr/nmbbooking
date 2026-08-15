<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $page_revision_id
 * @property string $public_id
 * @property string $component_key
 * @property string $component_version
 * @property int $position
 * @property bool $enabled
 * @property string|null $variant_key
 * @property array<string, mixed> $props_json
 * @property array<string, mixed>|null $style_json
 * @property array<string, mixed>|null $visibility_rules_json
 * @property int $lock_version
 * @property-read PageRevision $revision
 * @property-read Collection<int, PageBlockTranslation> $translations
 */
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

    /** @return BelongsTo<PageRevision, $this> */
    public function revision(): BelongsTo
    {
        return $this->belongsTo(PageRevision::class, 'page_revision_id');
    }

    /** @return HasMany<PageBlockTranslation, $this> */
    public function translations(): HasMany
    {
        return $this->hasMany(PageBlockTranslation::class);
    }
}
