<?php

declare(strict_types=1);

namespace App\Modules\Shared\Services;

use Opis\JsonSchema\Validator;
use RuntimeException;

final class JsonSchemaValidator
{
    /** @param array<string, mixed> $schema */
    public function assertValid(mixed $data, array $schema, string $context): void
    {
        $result = (new Validator)->validate(
            json_decode(json_encode($data, JSON_THROW_ON_ERROR), false, 512, JSON_THROW_ON_ERROR),
            json_decode(json_encode($schema, JSON_THROW_ON_ERROR), false, 512, JSON_THROW_ON_ERROR),
        );

        if (! $result->isValid()) {
            throw new RuntimeException("JSON schema validation failed for [{$context}]: ".$result->error()?->message());
        }
    }

    /** @return array<string, mixed> */
    public function schemaFile(string $path): array
    {
        $raw = file_get_contents($path);
        if ($raw === false) {
            throw new RuntimeException("JSON schema file is not readable [{$path}].");
        }

        $schema = json_decode($raw, true, flags: JSON_THROW_ON_ERROR);
        if (! is_array($schema)) {
            throw new RuntimeException("JSON schema file is not an object [{$path}].");
        }

        return $schema;
    }
}
