<?php

declare(strict_types=1);

namespace App\Modules\Content\Services;

use App\Modules\Components\Services\ComponentPropsValidator;
use App\Modules\Content\Models\PageBlock;
use App\Modules\Content\Models\PageBlockTranslation;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class UpdatePageBlockAction
{
    public function __construct(private readonly ComponentPropsValidator $props) {}

    /** @param array<string, mixed> $blockProps */
    public function execute(
        PageBlock $block,
        int $expectedLockVersion,
        array $blockProps,
        int $actorPlatformUserId,
        ?string $locale = null,
    ): PageBlock {
        return DB::connection((string) config('platform.tenant_connection_name'))->transaction(
            function () use ($block, $expectedLockVersion, $blockProps, $actorPlatformUserId, $locale): PageBlock {
                $lockedBlock = PageBlock::query()
                    ->with('revision')
                    ->whereKey($block->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($lockedBlock->revision->status !== 'draft') {
                    throw new RuntimeException('Only blocks in a draft revision can be edited.');
                }

                if ((int) $lockedBlock->lock_version !== $expectedLockVersion) {
                    throw new RuntimeException('Block edit conflict; refresh the revision before saving again.');
                }

                $this->props->assertValid($lockedBlock->component_key, $lockedBlock->component_version, $blockProps);
                if ($locale === null) {
                    $lockedBlock->forceFill(['props_json' => $blockProps]);
                } else {
                    PageBlockTranslation::query()->updateOrCreate(
                        ['page_block_id' => $lockedBlock->id, 'locale' => $locale],
                        ['props_json' => $blockProps],
                    );
                }

                $lockedBlock->forceFill(['lock_version' => $expectedLockVersion + 1])->save();
                DB::connection((string) config('platform.tenant_connection_name'))->table('audit_events')->insert([
                    'actor_platform_user_id' => $actorPlatformUserId,
                    'event_key' => 'content.page-block.updated',
                    'subject_type' => PageBlock::class,
                    'subject_public_id' => $lockedBlock->public_id,
                    'metadata_json' => json_encode([
                        'revision_id' => $lockedBlock->page_revision_id,
                        'locale' => $locale,
                        'lock_version' => $lockedBlock->lock_version,
                    ], JSON_THROW_ON_ERROR),
                    'created_at' => now(),
                ]);

                return $lockedBlock->fresh(['translations', 'revision']);
            },
        );
    }
}
