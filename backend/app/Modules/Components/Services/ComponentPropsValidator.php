<?php

declare(strict_types=1);

namespace App\Modules\Components\Services;

use App\Modules\Shared\Services\JsonSchemaValidator;
use Illuminate\Validation\ValidationException;
use RuntimeException;

final class ComponentPropsValidator
{
    public function __construct(
        private readonly ComponentRegistry $components,
        private readonly JsonSchemaValidator $schemas,
    ) {}

    /** @param array<string, mixed> $props */
    public function assertValid(string $componentKey, string $componentVersion, array $props): void
    {
        $manifest = $this->components->require($componentKey, $componentVersion);

        try {
            $this->schemas->assertValid(
                $props === [] ? (object) [] : $props,
                (array) $manifest['propsSchema'],
                "component-props:{$componentKey}@{$componentVersion}",
            );
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages(['props' => $exception->getMessage()]);
        }
    }
}
