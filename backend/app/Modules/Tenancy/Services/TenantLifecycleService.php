<?php

declare(strict_types=1);

namespace App\Modules\Tenancy\Services;

use App\Modules\Tenancy\Models\Tenant;
use Illuminate\Support\Facades\DB;
use LogicException;

final class TenantLifecycleService
{
    /** @var array<string, array<int, string>> */
    private const TRANSITIONS = [
        'provisioning' => ['active', 'failed', 'archived'],
        'active' => ['suspended', 'failed', 'archived'],
        'suspended' => ['active', 'archived'],
        'failed' => ['provisioning', 'archived'],
        'archived' => [],
    ];

    public function transition(Tenant $tenant, string $targetStatus, ?int $actorUserId = null, ?string $reason = null): Tenant
    {
        $currentStatus = $tenant->status;
        if (! in_array($targetStatus, self::TRANSITIONS[$currentStatus] ?? [], true)) {
            throw new LogicException("Tenant status [{$currentStatus}] cannot transition to [{$targetStatus}].");
        }

        if ($targetStatus === 'active' && ($tenant->database === null || $tenant->database->status !== 'ready')) {
            throw new LogicException('A tenant database must be ready before activation.');
        }

        return DB::connection('platform')->transaction(function () use ($tenant, $targetStatus, $actorUserId, $reason): Tenant {
            $lockedTenant = Tenant::query()->with('database')->lockForUpdate()->findOrFail($tenant->id);
            $lockedTenant->forceFill(['status' => $targetStatus])->save();

            DB::connection('platform')->table('platform_audit_events')->insert([
                'tenant_id' => $lockedTenant->id,
                'actor_user_id' => $actorUserId,
                'event_key' => 'tenant.lifecycle.transitioned',
                'subject_type' => Tenant::class,
                'subject_public_id' => $lockedTenant->public_id,
                'metadata_json' => json_encode([
                    'from_status' => $tenant->status,
                    'to_status' => $targetStatus,
                    'reason' => $reason,
                ], JSON_THROW_ON_ERROR),
                'created_at' => now(),
            ]);

            return $lockedTenant;
        });
    }
}
