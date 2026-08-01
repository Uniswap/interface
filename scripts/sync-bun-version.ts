#!/usr/bin/env bun
/**
 * `.bun-version` is the single source of truth for the repo's Bun version. Most
 * consumers read it directly (setup-bun's `bun-version-file`, the `preinstall`
 * runtime gate, Dockerfiles, `local:check`); this script rewrites the pins that
 * can't: `.github/runs-on.yml` (BUN_VERSION + BUN_SHA256 — the runner preinstall
 * runs at VM boot, before any checkout exists), `package.json` and
 * `apps/web/package.json` (engines.bun), and `apps/mobile/eas.json` (EAS needs
 * an exact semver). `@types/bun` is a regular npm dependency, bumped separately.
 *
 * Usage:
 *   bun sync:bun-version           # rewrite pins; fetches the official SHA256
 *   bun sync:bun-version --check   # verify pins, including BUN_SHA256 against the official
 *                                  # SHASUMS256.txt (a failed fetch fails the check)
 *
 * Bumping Bun: edit `.bun-version`, run `bun sync:bun-version`, then `bun install`.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '..')

// The artifact the CI runner preinstall downloads (see .github/runs-on.yml).
const RUNNER_ARTIFACT = 'bun-linux-x64.zip'

/** `pattern` matches every pin in the file at `path`; the pinned value is capture group 2. */
interface Pin {
  path: string
  pattern: RegExp
}

export const VERSION_PINS: Pin[] = [
  { path: '.github/runs-on.yml', pattern: /(BUN_VERSION=")([^"]+)(")/g },
  { path: 'package.json', pattern: /("bun": ">=)([^"]+)(")/g },
  { path: 'apps/web/package.json', pattern: /("bun": ">=)([^"]+)(")/g },
  { path: 'apps/mobile/eas.json', pattern: /("bun": ")(\d+\.\d+\.\d+)(")/g },
]

export const SHA_PIN: Pin = { path: '.github/runs-on.yml', pattern: /(BUN_SHA256=")([^"]+)(")/g }

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

export function parseOfficialSha256(shasums: string, artifact: string): string {
  const sha = shasums
    .split('\n')
    .find((line) => line.trim().endsWith(artifact))
    ?.trim()
    .split(/\s+/)[0]
  if (!sha || !/^[0-9a-f]{64}$/.test(sha)) {
    throw new Error(`No SHA256 entry for ${artifact} in SHASUMS256.txt`)
  }
  return sha
}

/**
 * Validates the BUN_SHA256 pin: exactly one match, 64 hex chars, and matching
 * `officialSha256` (omitted only when the fetch itself already failed, which
 * is reported as its own problem).
 */
export function checkShaPin(content: string, officialSha256?: string): string[] {
  const [pinned, ...extra] = extractPinnedValues(content, SHA_PIN.pattern)
  if (!pinned || extra.length > 0 || !/^[0-9a-f]{64}$/.test(pinned)) {
    return [
      `${SHA_PIN.path}: expected exactly one 64-hex-char BUN_SHA256 pin matching ${SHA_PIN.pattern} — update the pin list in scripts/sync-bun-version.ts`,
    ]
  }
  if (officialSha256 !== undefined && pinned !== officialSha256) {
    return [`${SHA_PIN.path}: pinned BUN_SHA256 ${pinned}, official is ${officialSha256} for ${RUNNER_ARTIFACT}`]
  }
  return []
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

async function fetchOfficialSha256(version: string): Promise<string> {
  const url = `https://github.com/oven-sh/bun/releases/download/bun-v${version}/SHASUMS256.txt`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${response.status}`)
  }
  return parseOfficialSha256(await response.text(), RUNNER_ARTIFACT)
}

async function syncPins(version: string): Promise<void> {
  const sha256 = await fetchOfficialSha256(version)
  const edits = [...VERSION_PINS.map((pin) => ({ pin, value: version })), { pin: SHA_PIN, value: sha256 }]
  for (const { pin, value } of edits) {
    const file = join(REPO_ROOT, pin.path)
    const content = readFileSync(file, 'utf8')
    if (extractPinnedValues(content, pin.pattern).length === 0) {
      throw new Error(noPinMatched(pin))
    }
    writeFileSync(file, replacePinnedValues(content, pin.pattern, value))
  }
}

async function main(): Promise<void> {
  const version = readExpectedVersion()
  if (!process.argv.includes('--check')) {
    await syncPins(version)
    console.log(`Synced Bun version pins to ${version} (BUN_SHA256 refreshed for ${RUNNER_ARTIFACT})`)
    return
  }
  const problems = checkPins(version)
  let officialSha256: string | undefined
  try {
    officialSha256 = await fetchOfficialSha256(version)
  } catch (error) {
    problems.push(`could not fetch SHASUMS256.txt to verify BUN_SHA256: ${error}`)
  }
  problems.push(...checkShaPin(readFileSync(join(REPO_ROOT, SHA_PIN.path), 'utf8'), officialSha256))
  if (problems.length > 0) {
    console.error(`Bun version pins are out of sync with .bun-version (${version}):`)
    for (const problem of problems) {
      console.error(`  - ${problem}`)
    }
    console.error('\nFix: run `bun sync:bun-version` and commit the result.')
    process.exit(1)
  }
  console.log(`All Bun version pins match .bun-version (${version}); BUN_SHA256 verified against SHASUMS256.txt`)
}

if (import.meta.main) {
  await main()
}
