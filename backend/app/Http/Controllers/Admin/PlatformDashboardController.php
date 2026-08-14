<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use Illuminate\Contracts\View\View;
use Illuminate\Support\Facades\DB;

final class PlatformDashboardController
{
    public function __invoke(): View
    {
        $platform = DB::connection('platform');

        return view('admin.platform-dashboard', [
            'metrics' => [
                'activeTenants' => $platform->table('tenants')->where('status', 'active')->count(),
                'provisioningTenants' => $platform->table('tenants')->where('status', 'provisioning')->count(),
                'failedProvisioningRuns' => $platform->table('provisioning_runs')->where('status', 'failed')->count(),
                'readyTenantDatabases' => $platform->table('tenant_databases')->where('status', 'ready')->count(),
                'activePackageVersions' => $platform->table('package_versions')->where('is_active', true)->count(),
            ],
            'recentEvents' => $platform->table('platform_audit_events')
                ->orderByDesc('created_at')
                ->limit(12)
                ->get(),
        ]);
    }
}
