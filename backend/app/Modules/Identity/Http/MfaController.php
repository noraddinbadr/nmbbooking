<?php

declare(strict_types=1);

namespace App\Modules\Identity\Http;

use App\Models\User;
use App\Modules\Identity\Services\MfaTotpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

final readonly class MfaController
{
    public function __construct(private MfaTotpService $mfaTotpService) {}

    public function prepare(Request $request): JsonResponse
    {
        $setup = $this->mfaTotpService->begin($this->resolvedUser($request));

        return response()->json([
            'data' => [
                'factor_public_id' => $setup['factor']->public_id,
                'provisioning_uri' => $setup['provisioning_uri'],
            ],
        ], 201);
    }

    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'factor_public_id' => ['required', 'string', 'ulid'],
            'code' => ['required', 'string', 'max:32'],
        ]);

        $recoveryCodes = $this->mfaTotpService->confirm(
            $this->resolvedUser($request),
            $data['factor_public_id'],
            $data['code'],
        );

        return response()->json([
            'data' => ['recovery_codes' => $recoveryCodes],
        ]);
    }

    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:32'],
        ]);
        $this->mfaTotpService->disable($this->resolvedUser($request), $data['code']);

        return response()->json(status: 204);
    }

    private function resolvedUser(Request $request): User
    {
        $user = $request->user();
        abort_unless($user instanceof User, 401);

        return $user;
    }
}
