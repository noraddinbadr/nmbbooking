<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Content\Models\PageBlock;
use Illuminate\Support\Facades\DB;

final class AutosavePageBlockAction
{
    public function __construct(private readonly UpdatePageBlockAction $updateBlock) {}

    /** @param array<string, mixed> $props */
    public function execute(
        PageBlock $block,
        int $expectedLockVersion,
        array $props,
        int $actorPlatformUserId,
        ?string $locale = null,
    ): PageBlock {
        $saved = $this->updateBlock->execute($block, $expectedLockVersion, $props, $actorPlatformUserId, $locale);

        DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
            'actor_platform_user_id' => $actorPlatformUserId,
            'event_key' => 'content.page-block.autosaved',
            'subject_type' => PageBlock::class,
            'subject_public_id' => $saved->public_id,
            'metadata_json' => json_encode([
                'revision_id' => $saved->page_revision_id,
                'locale' => $locale,
                'lock_version' => $saved->lock_version,
            ], JSON_THROW_ON_ERROR),
            'created_at' => now(),
        ]);

        return $saved;
    }
}
