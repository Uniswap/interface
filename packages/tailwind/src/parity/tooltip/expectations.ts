/**
 * Pinned, per-case scoped diffs for the tooltip content-frame parity matrix:
 * the deltas between what Tamagui emits and what the compiled Tailwind
 * classes emit that are ACCEPTED, each tied to the pinned palette-drift
 * ledger. Anything not pinned here fails the matrix.
 */
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift, PALETTE_DRIFT } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'
import type { TooltipContentMatrixProps } from './matrix'

/** Scope-merger bound to one case's output map (flex-expectations shape). */
function scopedMerger(out: Map<string, DeclarationDiff>): (scope: string, diff: DeclarationDiff) => void {
  return (scope, diff) => {
    if (Object.keys(diff).length > 0) {
      out.set(scope, { ...out.get(scope), ...diff })
    }
  }
}

export function expectedContentDiffs(props: TooltipContentMatrixProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  // The frame's default borderColor is $surface3 (no matrix case overrides
  // it) and no case's backgroundColor override drifts — so the only color
  // deltas are the pinned $surface3 palette drift.
  merge(
    BASE_SCOPE,
    expectedDrift({ backgroundColor: props.backgroundColor as string | undefined, borderColor: '$surface3' }, theme),
  )
  // The light-theme frame shadow embeds $surface3 inside its color-mix
  // opacity fold (shadowOpacity 0.04) — the same pinned drift, shadow-shaped.
  // With an empty ledger the shadows agree byte-for-byte, so no pin. The dark
  // theme emits no box-shadow on either side (the legacy dark block only
  // zeroes offset/radius, which Tamagui-web drops entirely).
  const drift = theme === 'light' ? PALETTE_DRIFT.light['$surface3'] : undefined
  if (drift !== undefined) {
    merge(BASE_SCOPE, {
      'box-shadow': {
        tamagui: `0px 6px 12px color-mix(in srgb,${drift.tamagui} 4%,transparent)`,
        tailwind: `0px 6px 12px color-mix(in srgb,${drift.tailwind} 4%,transparent)`,
      },
    })
  }
  return out
}
