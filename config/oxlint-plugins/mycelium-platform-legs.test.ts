/**
 * Run with `bun test config/oxlint-plugins/mycelium-platform-legs.test.ts`
 *
 * Alignment guard for the platform-leg manifest
 * (packages/mycelium/platform-legs.json) that drives
 * `universe-custom/no-throwing-stub-imports`. Lives here rather than in
 * mycelium's vitest suite so it runs in the unconditional
 * `bun test config/oxlint-plugins` CI step — a mycelium exports change
 * must not be able to skip it via nx selection.
 *
 * What it pins:
 *  - every JS entry point in mycelium's package.json `exports` has a manifest
 *    row, and every manifest row is a real entry point — a new entry point
 *    cannot ship without declaring its platform legs, which is what keeps the
 *    lint gate from going silently blind to new throwing stubs;
 *  - statuses are from the closed enum the rule understands;
 *  - every leg declared 'throws' actually has platform-split files for that
 *    platform under the entry's directory (a stub can't be declared where no
 *    platform split exists).
 *
 * Known gap (review-bot follow-up, deferred): this only pins per-subpath
 * `exports` entries against their manifest rows, not the root ('.') entry's
 * own named-export *list* against `entryPoints['.'].namedExports` — nothing
 * here would catch a future `export { SomeStubLeggedThing } from '...'`
 * added to src/index.ts without a matching namedExports row, the same
 * failure mode this file already guards against one axis over. Not built
 * here: src/index.ts re-exports via `export *` from `@universe/tailwind/types`
 * among named exports, so pinning "the root barrel's actual named exports"
 * needs a real export-binding resolver (walk re-exports, including
 * wildcards, to their ultimate names), not a text scan — a bigger, more
 * failure-prone piece of tooling than fits a focused follow-up commit, in
 * the same category as the AST stub-detection gap below.
 */
import { describe, expect, test } from 'bun:test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

const REPO_ROOT = join(import.meta.dir, '../..')
const MYCELIUM_ROOT = join(REPO_ROOT, 'packages/mycelium')

const LEG_STATUSES = new Set(['real', 'throws', 'missing'])

interface ManifestEntry {
  web?: string
  native?: string
  webNote?: string
  nativeNote?: string
  namedExports?: Record<string, { web?: string; native?: string; webNote?: string; nativeNote?: string }>
}

const packageJson = JSON.parse(readFileSync(join(MYCELIUM_ROOT, 'package.json'), 'utf8')) as {
  exports: Record<string, string | { default?: string; import?: string; require?: string }>
}
const manifest = JSON.parse(readFileSync(join(MYCELIUM_ROOT, 'platform-legs.json'), 'utf8')) as {
  entryPoints: Record<string, ManifestEntry>
}

/**
 * A conditional exports entry with no `default` condition would silently
 * drop out of the alignment set if only `.default` were read — fall back
 * through the other file-producing conditions in the same precedence Node
 * itself uses. `types` is deliberately excluded: a types-only condition with
 * no JS target isn't a platform leg to check.
 */
function exportTarget(
  value: string | { default?: string; import?: string; require?: string } | undefined,
): string | undefined {
  if (value === undefined) {
    return undefined
  }
  return typeof value === 'string' ? value : (value.default ?? value.import ?? value.require)
}

describe('exportTarget', () => {
  // Regression pin: a missing exports entry must come back `undefined` so the
  // "has no exports target" assert below actually fires, instead of being
  // masked into `''` (a defined value) and later crashing the fs calls with
  // an unrelated EISDIR.
  test('returns undefined for a missing exports entry', () => {
    expect(exportTarget(undefined)).toBeUndefined()
  })
})

/** JS entry points only — CSS exports have no platform legs. */
const jsExportKeys = Object.entries(packageJson.exports)
  .filter(([, value]) => {
    const target = exportTarget(value)
    return target !== undefined && !target.endsWith('.css')
  })
  .map(([key]) => key)
  .sort()

describe('mycelium platform-leg manifest', () => {
  test('covers exactly the JS entry points in package.json exports', () => {
    expect(Object.keys(manifest.entryPoints).sort()).toEqual(jsExportKeys)
  })

  // The './icons' and './icons/*' entries carry the same four web-only-holdout
  // namedExports, hand-duplicated because JSON can't factor out a shared object.
  // Pin them identical so a future edit to one block (a 5th holdout, a reworded
  // note) can't silently drift from the other.
  test("'./icons' and './icons/*' namedExports stay identical", () => {
    expect(manifest.entryPoints['./icons'].namedExports).toEqual(manifest.entryPoints['./icons/*'].namedExports)
  })

  // Same hand-duplication for the logos pair (the GoogleChromeLogo native holdout).
  test("'./logos' and './logos/*' namedExports stay identical", () => {
    expect(manifest.entryPoints['./logos'].namedExports).toEqual(manifest.entryPoints['./logos/*'].namedExports)
  })

  test('every leg status is from the closed enum', () => {
    for (const [key, entry] of Object.entries(manifest.entryPoints)) {
      expect(LEG_STATUSES.has(entry.web ?? ''), `${key} web status "${entry.web}"`).toBe(true)
      expect(LEG_STATUSES.has(entry.native ?? ''), `${key} native status "${entry.native}"`).toBe(true)
      for (const [name, named] of Object.entries(entry.namedExports ?? {})) {
        for (const platform of ['web', 'native'] as const) {
          const status = named[platform]
          if (status !== undefined) {
            expect(LEG_STATUSES.has(status), `${key} namedExports.${name} ${platform} status "${status}"`).toBe(true)
          }
        }
      }
    }
  })

  // A candidate leg file must actually back this entry point's export
  // target — not merely share a directory with it. The target is often a
  // barrel (index.ts) that re-exports the real component by relative
  // specifier (e.g. tooltip-compat's index.ts does `export { TooltipCompat }
  // from './TooltipCompat'`), so a leg file counts only if its logical
  // name (suffix stripped) either matches the target's own basename (the
  // compat families' `index.native.ts` sits directly beside `index.ts`) or
  // is referenced by relative specifier from the target's source. Accepting
  // any suffixed sibling in the directory — the naive version of this check
  // — would pass on an unrelated same-directory helper (e.g.
  // segmented-control-compat's needs-small-font.native.ts) even if the
  // entry's own leg were missing.
  const PLATFORM_SEGMENT_NAMES = ['web', 'native', 'ios', 'android']

  function stripPlatformSegment(fileNameWithoutExt: string): string {
    const segment = PLATFORM_SEGMENT_NAMES.find((name) => fileNameWithoutExt.endsWith(`.${name}`))
    return segment ? fileNameWithoutExt.slice(0, -(segment.length + 1)) : fileNameWithoutExt
  }

  function legFileBacksTarget(logicalName: string, targetBasename: string, targetSource: string): boolean {
    return logicalName === targetBasename || new RegExp(`['"]\\./${logicalName}['"]`).test(targetSource)
  }

  test("every entry declared 'throws' has platform-split leg files that actually back its export target", () => {
    for (const [key, entry] of Object.entries(manifest.entryPoints)) {
      for (const platform of ['web', 'native'] as const) {
        if (entry[platform] !== 'throws') {
          continue
        }
        const target = exportTarget(packageJson.exports[key])
        expect(target, `${key} has no exports target`).toBeDefined()
        // A wildcard key's target is a glob (e.g. `./src/components/icons/*.tsx`
        // for `./icons/*`), not a real file — reading it would ENOENT. Fail
        // legibly instead: a wildcard subpath fans out over many files, so no
        // single one can stand in as "the" leg backing a 'throws' declaration.
        expect((target as string).includes('*'), `${key} is a wildcard export and cannot be declared 'throws'`).toBe(
          false,
        )
        const entryDir = join(MYCELIUM_ROOT, dirname(target as string))
        const targetBasename = basename(target as string).replace(/\.[jt]sx?$/, '')
        const targetSource = readFileSync(join(MYCELIUM_ROOT, target as string), 'utf8')
        const suffixes =
          platform === 'web'
            ? ['.web.ts', '.web.tsx']
            : ['.native.ts', '.native.tsx', '.ios.ts', '.ios.tsx', '.android.ts', '.android.tsx']
        const legFiles = readdirSync(entryDir).filter((file) => {
          if (!suffixes.some((suffix) => file.endsWith(suffix)) || file.includes('.test.')) {
            return false
          }
          if (!statSync(join(entryDir, file)).isFile()) {
            return false
          }
          const logicalName = stripPlatformSegment(file.replace(/\.[jt]sx?$/, ''))
          return legFileBacksTarget(logicalName, targetBasename, targetSource)
        })
        expect(
          legFiles.length,
          `${key} declares ${platform} 'throws' but no file under ${entryDir} both carries a ${platform} suffix and backs the export target ${target}`,
        ).toBeGreaterThan(0)
      }
    }
  })
})
