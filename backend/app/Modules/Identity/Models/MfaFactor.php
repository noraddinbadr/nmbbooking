<?php

declare(strict_types=1);

namespace App\Modules\Identity\Models;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $user_id
 * @property string $public_id
 * @property string $type
 * @property string $secret_encrypted
 * @property array<int, string>|null $recovery_codes_encrypted
 * @property CarbonImmutable|null $verified_at
 * @property CarbonImmutable|null $last_used_at
 * @property CarbonImmutable|null $disabled_at
 * @property-read User $user
 */
final class MfaFactor extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'user_id',
        'public_id',
        'type',
        'secret_encrypted',
        'recovery_codes_encrypted',
        'verified_at',
        'last_used_at',
        'disabled_at',
    ];

    protected function casts(): array
    {
        return [
            'secret_encrypted' => 'encrypted',
            'recovery_codes_encrypted' => 'encrypted:array',
            'verified_at' => 'immutable_datetime',
            'last_used_at' => 'immutable_datetime',
            'disabled_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
