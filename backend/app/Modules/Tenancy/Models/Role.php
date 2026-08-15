<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $key
 * @property string $scope
 * @property string $name
 */
final class Role extends Model
{
    protected $connection = 'platform';

    protected $fillable = [
        'key',
        'scope',
        'name',
    ];
}
