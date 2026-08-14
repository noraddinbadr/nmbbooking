<?php

declare(strict_types=1);

namespace App\Modules\Shared\Models;

trait UsesTenantConnection
{
    public function getConnectionName(): string
    {
        return (string) config('platform.tenant_connection_name');
    }
}
