/**
 * The enumerated parity matrix for the tooltip content frame (INFRA-3021):
 * the legacy `ContentInner` styled defaults crossed with the exact style
 * overrides repo call sites pass to `Tooltip.Content`, each under light and
 * dark themes. The behavioral surface (hover/focus timing, dismissal,
 * positioning, z-index) lives in tooltip-behavior.test.tsx.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { TooltipContentCompatProps } from '../../../../mycelium/src/tooltip-compat/props'
import type { ThemeName } from '../core/theme'

export interface TooltipMatrixCase<P> {
  name: string
  props: P
  theme: ThemeName
}

const THEMES: ThemeName[] = ['light', 'dark']

function perTheme<P>(name: string, props: P): TooltipMatrixCase<P>[] {
  return THEMES.map((theme) => ({ name: `${name} [${theme}]`, props, theme }))
}

export type TooltipContentMatrixProps = Partial<TooltipContentCompatProps>

export function buildContentMatrix(): TooltipMatrixCase<TooltipContentMatrixProps>[] {
  return [
    ...perTheme('default frame (no overrides)', {}),
    // AnalyticsToggle.tsx
    ...perTheme('maxWidth string override', { maxWidth: '290px' }),
    // FeeTierSelector.tsx / FeeTierSearchRow.tsx
    ...perTheme('maxWidth number + pointerEvents auto', { maxWidth: 280, pointerEvents: 'auto' }),
    // LiquidityPositionInfoBadges.tsx / SendRecipientForm.tsx
    ...perTheme('maxWidth fit-content', { maxWidth: 'fit-content' }),
    // DisconnectButton.tsx
    ...perTheme('pointerEvents + RN padding longhands', {
      pointerEvents: 'auto',
      paddingVertical: 8,
      paddingHorizontal: 8,
    }),
    // BidMarker.tsx — the frame fully flattened.
    ...perTheme('transparent flattened frame (BidMarker)', {
      backgroundColor: 'transparent',
      borderWidth: 0,
      p: 0,
      pointerEvents: 'none',
    }),
    // ValuationSliderV1.tsx
    ...perTheme('padding token override', { p: '$spacing12' }),
    // DemoAddressDisplay.tsx
    ...perTheme('margin shorthand', { ml: '$spacing8' }),
    // AuctionStatsBanner.tsx
    ...perTheme('explicit surface restatement', { backgroundColor: '$surface1', borderRadius: '$rounded12' }),
  ]
}
