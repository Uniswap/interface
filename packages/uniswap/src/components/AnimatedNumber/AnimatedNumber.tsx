import type { ColorTokens } from 'ui/src'
import type { FontVariantToken } from 'ui/src/theme'
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
