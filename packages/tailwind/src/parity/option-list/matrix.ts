/**
 * The enumerated parity matrices for the option-list visual vocabulary
 * (INFRA-3021 dropdown set): the selectable option row frame + label
 * (the legacy `NetworkOption` inner Flex/Text from
 * `uniswap/src/components/network/NetworkOption.tsx`) and the tier section
 * header (the legacy `SectionHeader` from
 * `uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent.tsx`),
 * each crossed with light/dark themes. The behavioral surface (search
 * filtering, keyboard navigation, empty state) lives in
 * option-list-behavior.test.tsx.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type {
  OptionListSectionHeaderStyleInputs,
  OptionRowFrameStyleInputs,
} from '../../../../mycelium/src/option-list-compat/compile'
import type { ThemeName } from '../core/theme'

export interface OptionListMatrixCase<P> {
  name: string
  props: P
  theme: ThemeName
}

const THEMES: ThemeName[] = ['light', 'dark']

function perTheme<P>(name: string, props: P): OptionListMatrixCase<P>[] {
  return THEMES.map((theme) => ({ name: `${name} [${theme}]`, props, theme }))
}

// ── Option row frame (NetworkOption's root Flex, verbatim) ───────────────

export type OptionRowFrameMatrixProps = OptionRowFrameStyleInputs

export function buildOptionRowFrameMatrix(): OptionListMatrixCase<OptionRowFrameMatrixProps>[] {
  return [
    // NetworkOption default hover radius ($rounded8).
    ...perTheme('default row (hover radius $rounded8)', {}),
    // The NetworkFilterV2 row payload (`borderRadius="$rounded16"`).
    ...perTheme('NetworkFilterV2 row (hover radius $rounded16)', { borderRadius: '$rounded16' as const }),
  ]
}

// ── Option row label (NetworkOption's Text, verbatim) ────────────────────

export type OptionRowLabelMatrixProps = Record<string, never>

export function buildOptionRowLabelMatrix(): OptionListMatrixCase<OptionRowLabelMatrixProps>[] {
  return perTheme('row label (body2 $neutral1)', {})
}

// ── Tier section header frame (SectionHeader's Flex, verbatim) ───────────

export type SectionHeaderMatrixProps = OptionListSectionHeaderStyleInputs

export function buildSectionHeaderMatrix(): OptionListMatrixCase<SectionHeaderMatrixProps>[] {
  return [
    // The web-desktop / extension presentation ($platform-web sticky).
    ...perTheme('sticky section header', { sticky: true }),
    // The non-sticky presentation (small-viewport web app).
    ...perTheme('non-sticky section header', { sticky: false }),
  ]
}

// ── Tier section header title (SectionHeader's Text, verbatim) ──────────

export type SectionHeaderTitleMatrixProps = Record<string, never>

export function buildSectionHeaderTitleMatrix(): OptionListMatrixCase<SectionHeaderTitleMatrixProps>[] {
  return perTheme('section header title (body4 $neutral2)', {})
}
