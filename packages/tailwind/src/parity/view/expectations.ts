/**
 * Per-case expected diffs for the View scoped parity comparison.
 *
 * The View matrix is layout-only (no color-bearing props, no scoped pools), so
 * in practice every case must diff empty; palette drift is still consulted so
 * a future color case pins its drift instead of failing opaquely.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { ViewCompatProps } from '../../../../mycelium/src/view-compat/compile'
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'

/** The full expected scope → diff map for one matrix case. Scopes not present must diff empty. */
export function expectedScopedDiffs(props: ViewCompatProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const drift = expectedDrift(props, theme)
  if (Object.keys(drift).length > 0) {
    out.set(BASE_SCOPE, drift)
  }
  return out
}
