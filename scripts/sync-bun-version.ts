#!/usr/bin/env bun
/**
 * `.bun-version` is the single source of truth for the repo's Bun version. Most
 * consumers read it directly (setup-bun's `bun-version-file`, the `preinstall`
 * runtime gate, Dockerfiles, `local:check`, and CI runners via
 * `monorepo_bun_install` → `oven-sh/setup-bun`). This script rewrites the
 * remaining pins that can't read the file: `package.json` and
 * `apps/web/package.json` (engines.bun) and `apps/mobile/eas.json` (EAS needs an
 * exact semver). `@types/bun` is a regular npm dependency, bumped separately.
 *
 * Usage:
 *   bun sync:bun-version           # rewrite pins to match `.bun-version`
 *   bun sync:bun-version --check   # verify pins match `.bun-version` (CI drift guard)
 *
 * Bumping Bun: edit `.bun-version`, run `bun sync:bun-version`, then `bun install`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')

/** `pattern` matches every pin in the file at `path`; the pinned value is capture group 2. */
interface Pin {
  path: string
  pattern: RegExp
}

export const VERSION_PINS: Pin[] = [
  { path: 'package.json', pattern: /("bun": ">=)([^"]+)(")/g },
  { path: 'apps/web/package.json', pattern: /("bun": ">=)([^"]+)(")/g },
  { path: 'apps/mobile/eas.json', pattern: /("bun": ")(\d+\.\d+\.\d+)(")/g },
]

const noPinMatched = (pin: Pin): string =>
  `${pin.path}: no Bun pin matched ${pin.pattern} — update the pin list in scripts/sync-bun-version.ts`

export function readExpectedVersion(): string {
  return readFileSync(join(REPO_ROOT, '.bun-version'), 'utf8').trim()
}

export function extractPinnedValues(content: string, pattern: RegExp): string[] {
  return Array.from(content.matchAll(pattern), (match) => match[2] ?? '')
}

export function replacePinnedValues(content: string, pattern: RegExp, value: string): string {
  return content.replace(pattern, `$1${value}$3`)
}

function checkPins(version: string): string[] {
  return VERSION_PINS.flatMap((pin) => {
    const values = extractPinnedValues(readFileSync(join(REPO_ROOT, pin.path), 'utf8'), pin.pattern)
    if (values.length === 0) {
      return [noPinMatched(pin)]
    }
    return values
      .filter((value) => value !== version)
      .map((value) => `${pin.path}: pinned ${value}, expected ${version}`)
  })
}

function syncPins(version: string): void {
  for (const pin of VERSION_PINS) {
    const file = join(REPO_ROOT, pin.path)
    const content = readFileSync(file, 'utf8')
    if (extractPinnedValues(content, pin.pattern).length === 0) {
      throw new Error(noPinMatched(pin))
    }
    writeFileSync(file, replacePinnedValues(content, pin.pattern, version))
  }
}

function main(): void {
  const version = readExpectedVersion()
  if (!process.argv.includes('--check')) {
    syncPins(version)
    console.log(`Synced Bun version pins to ${version}`)
    return
  }
  const problems = checkPins(version)
  if (problems.length > 0) {
    console.error(`Bun version pins are out of sync with .bun-version (${version}):`)
    for (const problem of problems) {
      console.error(`  - ${problem}`)
    }
    console.error('\nFix: run `bun sync:bun-version` and commit the result.')
    process.exit(1)
  }
  console.log(`All Bun version pins match .bun-version (${version})`)
}

if (import.meta.main) {
  main()
}
