<?php

declare(strict_types=1);

namespace App\Modules\Packages\Services;

use App\Modules\Tenancy\Services\TenantContext;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class PackageEntitlementService
{
    public function assertGranted(TenantContext $context, string $packageKey): void
    {
        if (! $this->isGranted($context, $packageKey)) {
            throw new RuntimeException("Tenant is not entitled to package [{$packageKey}].");
        }
    }

    public function isGranted(TenantContext $context, string $packageKey): bool
    {
        return DB::connection('platform')
            ->table('tenant_entitlements as entitlement')
            ->join('package_definitions as package', 'package.id', '=', 'entitlement.package_id')
            ->where('entitlement.tenant_id', $context->tenantId)
            ->where('package.package_key', $packageKey)
            ->where('package.is_listed', true)
            ->where('entitlement.is_enabled', true)
            ->where(fn ($query) => $query->whereNull('entitlement.expires_at')->orWhere('entitlement.expires_at', '>', now()))
            ->exists();
    }

    /**
     * @return Collection<int, array{packageKey: string, category: string, scope: string, displayName: array<string, string>, entitled: bool, expiresAt: string|null}>
     */
    public function marketplace(TenantContext $context): Collection
    {
        $listing = DB::connection('platform')
            ->table('package_definitions as package')
            ->leftJoin('tenant_entitlements as entitlement', function ($join) use ($context): void {
                $join->on('entitlement.package_id', '=', 'package.id')
                    ->where('entitlement.tenant_id', '=', $context->tenantId);
            })
            ->where('package.is_listed', true)
            ->orderBy('package.category')
            ->orderBy('package.package_key')
            ->get([
                'package.package_key',
                'package.category',
                'package.scope',
                'package.display_name_json',
                'entitlement.is_enabled as entitlement_enabled',
                'entitlement.expires_at',
            ])
            ->map(static function (object $package): array {
                $expiresAt = $package->expires_at === null ? null : (string) $package->expires_at;
                $isEnabled = (bool) $package->entitlement_enabled;
                $isCurrent = $expiresAt === null || $expiresAt > now()->toDateTimeString();
                $decodedDisplayName = json_decode((string) $package->display_name_json, true, flags: JSON_THROW_ON_ERROR);
                if (! is_array($decodedDisplayName)) {
                    throw new RuntimeException("Package [{$package->package_key}] has an invalid display name.");
                }

                /** @var array<string, string> $displayName */
                $displayName = $decodedDisplayName;

                return [
                    'packageKey' => (string) $package->package_key,
                    'category' => (string) $package->category,
                    'scope' => (string) $package->scope,
                    'displayName' => $displayName,
                    'entitled' => $isEnabled && $isCurrent,
                    'expiresAt' => $expiresAt,
                ];
            });

        /** @var Collection<int, array{packageKey: string, category: string, scope: string, displayName: array<string, string>, entitled: bool, expiresAt: string|null}> $listing */
        // Laravel Collection values are invariant; the mapped rows have the exact declared shape.
        /** @phpstan-ignore return.type */
        return $listing;
    }
}
