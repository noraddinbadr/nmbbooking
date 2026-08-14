<?php

declare(strict_types=1);

namespace App\Modules\Content\Models;

use App\Modules\Shared\Models\UsesTenantConnection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    public function page(): BelongsTo
    {
        return $this->belongsTo(Page::class);
    }

    public function blocks(): HasMany
    {
        return $this->hasMany(PageBlock::class)->orderBy('position');
    }
}
