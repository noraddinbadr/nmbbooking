<?php

declare(strict_types=1);

namespace App\Modules\Shared\Services;

use InvalidArgumentException;

final class SemverConstraint
{
    public function satisfies(string $version, string $constraint): bool
    {
        $candidate = $this->normalizeVersion($version);
        $alternatives = preg_split('/\s*\|\|?\s*/', trim($constraint));

        if ($alternatives === false || $alternatives === []) {
            throw new InvalidArgumentException('A semantic-version constraint is required.');
        }

        foreach ($alternatives as $alternative) {
            $comparators = preg_split('/[\s,]+/', trim($alternative));
            if ($comparators === false || $comparators === []) {
                continue;
            }

            $matches = true;
            foreach ($comparators as $comparator) {
                if ($comparator !== '' && ! $this->matchesComparator($candidate, $comparator)) {
                    $matches = false;
                    break;
                }
            }

            if ($matches) {
                return true;
            }
        }

        return false;
    }

    /** @param array{major: int, minor: int, patch: int, prerelease: string|null} $candidate */
    private function matchesComparator(array $candidate, string $comparator): bool
    {
        if (str_starts_with($comparator, '^')) {
            return $this->matchesCaret($candidate, substr($comparator, 1));
        }

        if (str_starts_with($comparator, '~')) {
            return $this->matchesTilde($candidate, substr($comparator, 1));
        }

        if (preg_match('/^(?<operator>>=|<=|>|<|=)?(?<version>[0-9][0-9A-Za-z.*-]*)$/', $comparator, $matches) !== 1) {
            throw new InvalidArgumentException("Unsupported semantic-version comparator [{$comparator}].");
        }

        $operator = $matches['operator'] !== '' ? $matches['operator'] : '=';
        $expected = $this->normalizeVersion($matches['version'], true);

        if ($expected['wildcardDepth'] !== null) {
            if (! in_array($operator, ['=', '>='], true)) {
                throw new InvalidArgumentException("Wildcard semantic-version comparator [{$comparator}] is not supported with [{$operator}].");
            }

            return $this->matchesWildcard($candidate, $expected);
        }

        return match ($operator) {
            '=' => $this->compare($candidate, $expected) === 0,
            '>' => $this->compare($candidate, $expected) > 0,
            '>=' => $this->compare($candidate, $expected) >= 0,
            '<' => $this->compare($candidate, $expected) < 0,
            '<=' => $this->compare($candidate, $expected) <= 0,
        };
    }

    /** @param array{major: int, minor: int, patch: int, prerelease: string|null} $candidate */
    private function matchesCaret(array $candidate, string $lowerBound): bool
    {
        $lower = $this->normalizeVersion($lowerBound);
        $upper = $lower['major'] > 0
            ? $this->version($lower['major'] + 1, 0, 0)
            : ($lower['minor'] > 0
                ? $this->version(0, $lower['minor'] + 1, 0)
                : $this->version(0, 0, $lower['patch'] + 1));

        return $this->compare($candidate, $lower) >= 0 && $this->compare($candidate, $upper) < 0;
    }

    /** @param array{major: int, minor: int, patch: int, prerelease: string|null} $candidate */
    private function matchesTilde(array $candidate, string $lowerBound): bool
    {
        $lower = $this->normalizeVersion($lowerBound);
        $upper = $this->version($lower['major'], $lower['minor'] + 1, 0);

        return $this->compare($candidate, $lower) >= 0 && $this->compare($candidate, $upper) < 0;
    }

    /**
     * @param  array{major: int, minor: int, patch: int, prerelease: string|null}  $candidate
     * @param  array{major: int, minor: int, patch: int, prerelease: string|null, wildcardDepth: int|null}  $expected
     */
    private function matchesWildcard(array $candidate, array $expected): bool
    {
        return match ($expected['wildcardDepth']) {
            0 => true,
            1 => $candidate['major'] === $expected['major'],
            2 => $candidate['major'] === $expected['major'] && $candidate['minor'] === $expected['minor'],
            default => false,
        };
    }

    /**
     * @param  array{major: int, minor: int, patch: int, prerelease: string|null}  $left
     * @param  array{major: int, minor: int, patch: int, prerelease: string|null}  $right
     */
    private function compare(array $left, array $right): int
    {
        foreach (['major', 'minor', 'patch'] as $part) {
            if ($left[$part] !== $right[$part]) {
                return $left[$part] <=> $right[$part];
            }
        }

        if ($left['prerelease'] === $right['prerelease']) {
            return 0;
        }

        if ($left['prerelease'] === null) {
            return 1;
        }

        if ($right['prerelease'] === null) {
            return -1;
        }

        return version_compare($left['prerelease'], $right['prerelease']);
    }

    /**
     * @return array{major: int, minor: int, patch: int, prerelease: string|null, wildcardDepth: int|null}
     */
    private function normalizeVersion(string $version, bool $allowWildcards = false): array
    {
        $version = trim($version);
        if (preg_match('/^(?<major>0|[1-9][0-9]*|[xX*])(?:\.(?<minor>0|[1-9][0-9]*|[xX*]))?(?:\.(?<patch>0|[1-9][0-9]*|[xX*]))?(?:-(?<prerelease>[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/', $version, $matches) !== 1) {
            throw new InvalidArgumentException("Invalid semantic version [{$version}].");
        }

        $parts = [
            $matches['major'],
            $matches['minor'] ?? null,
            $matches['patch'] ?? null,
        ];
        $wildcardDepth = null;
        foreach ($parts as $index => $part) {
            if ($part === null) {
                continue;
            }

            if (in_array($part, ['x', 'X', '*'], true)) {
                if (! $allowWildcards) {
                    throw new InvalidArgumentException("Wildcard versions are not allowed in [{$version}].");
                }

                $wildcardDepth = $index;
                break;
            }
        }

        if ($wildcardDepth !== null && array_filter(array_slice($parts, $wildcardDepth + 1), fn (?string $part): bool => $part !== null) !== []) {
            throw new InvalidArgumentException("Wildcard versions must be the final version part in [{$version}].");
        }

        return [
            'major' => is_numeric($parts[0]) ? (int) $parts[0] : 0,
            'minor' => is_numeric($parts[1]) ? (int) $parts[1] : 0,
            'patch' => is_numeric($parts[2]) ? (int) $parts[2] : 0,
            'prerelease' => ($matches['prerelease'] ?? '') !== '' ? $matches['prerelease'] : null,
            'wildcardDepth' => $wildcardDepth,
        ];
    }

    /** @return array{major: int, minor: int, patch: int, prerelease: null} */
    private function version(int $major, int $minor, int $patch): array
    {
        return ['major' => $major, 'minor' => $minor, 'patch' => $patch, 'prerelease' => null];
    }
}
