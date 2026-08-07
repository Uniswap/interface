/**
 * Pinned palette-drift ledger: semantic color tokens whose values differ
 * between the spore Tamagui theme (`ui/src/theme/color/colors.ts`) and the
 * `@universe/tailwind` token package (`css/theme.css`, `css/variables.css`).
 *
 * Verified 2026-07-24: the ledger is EMPTY. The spore token refresh
 * (INFRA-2353) synced every `@universe/tailwind` color to the current
 * generation in `ui/src/theme/color/colors.ts`, resolving all 19 previously
 * pinned drift entries (9 core tokens across themes plus the hovered
 * interaction states). The mechanism stays: if a token drifts again, the
 * affected matrix cases fail until the new drift is pinned here — drift can
 * never change silently.
 */
import type { DeclarationDiff } from './diff'
import type { ThemeName } from './theme'

/** One token's value in each system, in canonical `rgba(r,g,b,a)` form. */
export interface DriftEntry {
  tamagui: string
  tailwind: string
}

export const PALETTE_DRIFT: Record<ThemeName, Record<string, DriftEntry>> = {
  light: {},
  dark: {},
}

interface ColorProps {
  backgroundColor?: string
  borderColor?: string
}

/** The exact diff the ledger predicts for a case's color props (empty when none drift). */
export function expectedDrift({ backgroundColor, borderColor }: ColorProps, theme: ThemeName): DeclarationDiff {
  const diff: DeclarationDiff = {}
  if (backgroundColor !== undefined && Object.hasOwn(PALETTE_DRIFT[theme], backgroundColor)) {
    diff['background-color'] = { ...PALETTE_DRIFT[theme][backgroundColor] }
  }
  if (borderColor !== undefined && Object.hasOwn(PALETTE_DRIFT[theme], borderColor)) {
    for (const side of ['top', 'right', 'bottom', 'left']) {
      diff[`border-${side}-color`] = { ...PALETTE_DRIFT[theme][borderColor] }
    }
  }
  return diff
}
