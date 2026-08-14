<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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

    public function block(): BelongsTo
    {
        return $this->belongsTo(PageBlock::class, 'page_block_id');
    }
}
