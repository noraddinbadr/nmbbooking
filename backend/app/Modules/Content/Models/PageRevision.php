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
 * @property int $page_id
 * @property int $revision_no
 * @property string $template_key
 * @property string $status
 * @property int $created_by_platform_user_id
 * @property int|null $published_by_platform_user_id
 * @property-read Page $page
 * @property-read Collection<int, PageBlock> $blocks
 */
final class PageRevision extends Model
{
    use UsesTenantConnection;

    protected $fillable = [
        'page_id',
        'revision_no',
        'template_key',
        'status',
        'created_by_platform_user_id',
        'published_by_platform_user_id',
        'scheduled_for',
        'published_at',
        'change_note',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_for' => 'immutable_datetime',
            'published_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Page, $this> */
    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    /** @return HasMany<PageBlock, $this> */
    public function blocks(): HasMany
    {
        return $this->hasMany(PageBlock::class)->orderBy('position');
    }
}
