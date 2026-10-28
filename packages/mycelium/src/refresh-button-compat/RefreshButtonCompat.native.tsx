import type { JSX } from 'react'
import type { RefreshButtonCompatProps } from './props'

/**
 * Native stub for the web-only RefreshButton compat (INFRA-3489). The native
 * leg is deliberately deferred — the sole repo consumer
 * (`packages/uniswap/src/features/portfolio/PortfolioBalance/PortfolioBalance.tsx`)
 * web-guards the render (`isWebPlatform`), so no native code path can reach
 * this component today. Throwing keeps an accidental native render loud
 * instead of silently rendering nothing (the TooltipCompat / INFRA-3021
 * precedent). Mobile refreshes the portfolio balance with pull-to-refresh, so
 * nothing needs this yet. A real native leg must be built for touch, not
 * ported from the old ui one (an unanimated icon behind a hover-only reveal,
 * invisible on touch): always visible, with the one-turn spin in Reanimated.
 */
export function RefreshButtonCompat(_props: RefreshButtonCompatProps): JSX.Element {
  throw new Error(
    'RefreshButtonCompat is web-only; the native leg is deferred (INFRA-3489) — its sole consumer web-guards the render.',
  )
}
