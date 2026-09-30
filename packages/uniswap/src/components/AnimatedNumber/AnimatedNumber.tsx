import type { ColorTokens, FontVariantToken } from '@universe/mycelium'
import type { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
export type { AnimatedCharStylesType, AnimatedFontStylesType } from 'uniswap/src/components/AnimatedNumber/styles'
export { AnimatedCharStyles, AnimatedFontStyles } from 'uniswap/src/components/AnimatedNumber/styles'

export type AnimatedNumberProps = {
  loadingPlaceholderText?: string
  loading?: boolean | 'no-shimmer'
  value?: string
  numericValue?: number
  colorIndicationDuration?: number
  shouldFadeDecimals?: boolean
  warmLoading?: boolean
  disableAnimations?: boolean
  /**
   * Skip all animation work without changing layout: ticks apply statically and are consumed, so
   * un-suspending never replays a stale roll. For list rows outside the viewport, where animating
   * every mounted row exhausted native memory. Unlike `disableAnimations` nothing remounts. Native-only.
   */
  suspendAnimations?: boolean
  /** Overrides the computed up/down change direction (and its color) — e.g. for values like elapsed time that should always read as increasing. */
  forceDirection?: AnimatedNumberDirection
  /** Override text direction for digit stagger. Defaults to `i18next.dir() === 'rtl'`. */
  isRightToLeft?: boolean
  textVariant?: FontVariantToken
  color?: ColorTokens
  EndElement?: JSX.Element
  endElementGap?: number
  alignRight?: boolean
  containerTestID?: string
  ellipsis?: boolean
}

export default function AnimatedNumber(_props: AnimatedNumberProps): JSX.Element {
  throw new Error('AnimatedNumber: Implemented in .native.tsx and .web.tsx')
}
