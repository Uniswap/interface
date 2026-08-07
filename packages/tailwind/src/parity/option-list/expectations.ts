/**
 * Per-case expected (pinned, never-silent) diffs for the option-list parity
 * matrices — same two sources as the menu expectations: palette drift applied
 * from the case's effective style object, and documented structural pins tied
 * to the exclusions ledger.
 */
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'
import type {
  OptionRowFrameMatrixProps,
  OptionRowLabelMatrixProps,
  SectionHeaderMatrixProps,
  SectionHeaderTitleMatrixProps,
} from './matrix'

/** Returns a scope-merger bound to one case's output map (flex-expectations shape). */
function scopedMerger(out: Map<string, DeclarationDiff>): (scope: string, diff: DeclarationDiff) => void {
  return (scope, diff) => {
    if (Object.keys(diff).length > 0) {
      out.set(scope, { ...out.get(scope), ...diff })
    }
  }
}

export function expectedOptionRowFrameDiffs(
  _props: OptionRowFrameMatrixProps,
  theme: ThemeName,
): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  // The row hover state paints $surface2, which drifts between the token
  // systems in dark (pinned palette-drift entry).
  merge('hover', expectedDrift({ backgroundColor: '$surface2' }, theme))
  // Structural pin (TouchableArea ledger entry): the legacy interaction
  // surface is the TouchableArea WRAPPER, which owns cursor/user-select; the
  // compat row is a single element, so it carries them itself.
  merge(BASE_SCOPE, {
    cursor: { tailwind: 'pointer' },
    'user-select': { tailwind: 'none' },
  })
  return out
}

export function expectedOptionRowLabelDiffs(
  _props: OptionRowLabelMatrixProps,
  _theme: ThemeName,
): Map<string, DeclarationDiff> {
  // The label compiles through text-compat, whose generated `--stext-*` vars
  // pin the TAMAGUI palette values exactly — no drift expected.
  return new Map()
}

export function expectedSectionHeaderDiffs(
  _props: SectionHeaderMatrixProps,
  _theme: ThemeName,
): Map<string, DeclarationDiff> {
  // $surface1 is identical in both token systems.
  return new Map()
}

export function expectedSectionHeaderTitleDiffs(
  _props: SectionHeaderTitleMatrixProps,
  _theme: ThemeName,
): Map<string, DeclarationDiff> {
  return new Map()
}
