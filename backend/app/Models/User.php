<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

#[Fillable(['name', 'email', 'password', 'status'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    protected $connection = 'platform';

    protected static function booted(): void
    {
        static::creating(function (self $user): void {
            $user->public_id ??= Str::ulid()->toBase32();
            $user->status ??= 'active';
        });
    }

    public function hasPlatformPermission(string $permissionKey): bool
    {
        return DB::connection('platform')
            ->table('platform_user_roles as assignment')
            ->join('roles', 'roles.id', '=', 'assignment.role_id')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'roles.id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('assignment.user_id', $this->getKey())
            ->where('roles.scope', 'platform')
            ->where('permissions.key', $permissionKey)
            ->exists();
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'immutable_datetime',
            'last_login_at' => 'immutable_datetime',
            'password' => 'hashed',
        ];
    }
}
