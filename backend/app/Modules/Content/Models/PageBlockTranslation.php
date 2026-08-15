<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $page_block_id
 * @property string $locale
 * @property array<string, mixed> $props_json
 * @property-read PageBlock $block
 */
final class PageBlockTranslation extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'page_block_id',
        'locale',
        'props_json',
    ];

    protected function casts(): array
    {
        return ['props_json' => 'array'];
    }

    /** @return BelongsTo<PageBlock, $this> */
    public function block(): BelongsTo
    {
        return $this->belongsTo(PageBlock::class, 'page_block_id');
    }
}
