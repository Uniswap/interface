#!/usr/bin/env bun
/**
 * Floating dependency spec check
 *
 * Fails when any workspace package.json declares a dependency with a spec the
 * registry can re-resolve over time: a dist-tag (`latest`, `next`, `beta`, ...),
 * a bare wildcard (`*`, `x`), or an `npm:` alias without a pinned version.
 *
 * Bun re-resolves dist-tag specs against the registry on every install, so a
 * committed lockfile does not pin them: as soon as upstream publishes a new
 * version (and it clears the bunfig.toml minimumReleaseAge quarantine), the
 * tag points at a different version than the lockfile and
 * `bun install --frozen-lockfile` fails on every branch with zero commits.
 * Exact versions and semver ranges resolve from the lockfile and are allowed.
 *
 * Fix a violation by pinning the spec to the version recorded in bun.lock.
 *
 * Usage:
 *   bun scripts/check-dependency-specs.ts
 *
 * Exit 0 = no floating specs
 * Exit 1 = floating spec(s) found
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(import.meta.dir, '..')

const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
  'resolutions',
  'overrides',
] as const

/** Specs using these protocols do not resolve through registry dist-tags. */
const NON_REGISTRY_PROTOCOL =
  /^(workspace|file|link|portal|patch|catalog|git|git\+ssh|git\+http|git\+https|github|https?):/

interface Violation {
  file: string
  field: string
  name: string
  spec: string
  reason: string
}

/** Returns why a spec is floating, or null when it is safely pinned/ranged. */
function floatingReason(spec: string): string | null {
  const s = spec.trim()
  if (s.startsWith('npm:')) {
    // Alias: npm:name@<spec> — validate the embedded spec.
    const at = s.lastIndexOf('@')
    if (at <= 'npm:'.length) {
      return 'npm: alias without a version (implicit latest)'
    }
    return floatingReason(s.slice(at + 1))
  }
  if (NON_REGISTRY_PROTOCOL.test(s)) {
    return null
  }
  if (s === '' || s === '*' || s === 'x' || s === 'X') {
    return 'bare wildcard'
  }
  if (/^[a-zA-Z_]/.test(s)) {
    return 'dist-tag'
  }
  return null
}

function collectViolations(file: string, field: string, deps: Record<string, unknown>, out: Violation[]): void {
  for (const [name, spec] of Object.entries(deps)) {
    if (typeof spec === 'string') {
      const reason = floatingReason(spec)
      if (reason) {
        out.push({ file, field, name, spec, reason })
      }
    } else if (spec && typeof spec === 'object') {
      // Nested overrides ({ "pkg": { "sub": "1.2.3" } })
      collectViolations(file, field, spec as Record<string, unknown>, out)
    }
  }
}

function workspaceManifests(): string[] {
  const rootPkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { workspaces?: string[] }
  const manifests = ['package.json']
  for (const pattern of rootPkg.workspaces ?? []) {
    const glob = new Bun.Glob(`${pattern}/package.json`)
    for (const match of glob.scanSync({ cwd: ROOT })) {
      manifests.push(match)
    }
  }
  return manifests.sort()
}

function main(): void {
  const violations: Violation[] = []
  for (const file of workspaceManifests()) {
    const pkg = JSON.parse(readFileSync(join(ROOT, file), 'utf8')) as Record<string, unknown>
    for (const field of DEPENDENCY_FIELDS) {
      const deps = pkg[field]
      if (deps && typeof deps === 'object') {
        collectViolations(file, field, deps as Record<string, unknown>, violations)
      }
    }
  }

  if (violations.length === 0) {
    process.exit(0)
  }

  console.error(
    '❌ Floating dependency specs found — these re-resolve over time and will break `bun install --frozen-lockfile` when upstream publishes:\n',
  )
  for (const v of violations) {
    console.error(`  ${v.file} → ${v.field} → "${v.name}": "${v.spec}" (${v.reason})`)
  }
  console.error(
    '\nPin each spec to the exact version currently resolved in bun.lock (bunfig.toml sets save = "exact").',
  )
  process.exit(1)
}

main()
