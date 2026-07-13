import type { ResolvedFontStyle } from 'ui/src/theme'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import type { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

export interface ReanimatedNumberProps extends AnimatedNumberProps {
  currency: FiatCurrencyInfo
}

export type ReanimatedNumberRenderProps = {
  chars: string[]
  commonPrefixLength: number
  currency: FiatCurrencyInfo
  digitHeight: number
  digitCellWidth: number
  balanceChangeColor: string | undefined
  shouldFadeDecimals: boolean
  variantFont: ResolvedFontStyle
  baseColor: string
  decimalPartColor: string
  useHeadingTypography: boolean
  dir: AnimatedNumberDirection
  charDelays: number[]
  charShouldAnimate: boolean[]
  animateGen: number
  reduceMotion: boolean
}
