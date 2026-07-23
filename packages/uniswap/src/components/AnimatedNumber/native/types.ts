import type { ResolvedFontStyle } from 'ui/src/theme'
import type { AnimatedNumberProps } from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import type { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'
import type { FiatCurrencyInfo } from 'uniswap/src/features/fiatOnRamp/types'

export interface ReanimatedNumberProps extends AnimatedNumberProps {
  currency: FiatCurrencyInfo
}

/**
 * One value change = one immutable tick, derived synchronously in render. Everything a slot
 * needs to animate (direction, changed-prefix boundary, outgoing glyphs, flash color) travels
 * together in a single commit, so animations can never be triggered twice for one change.
 */
export type AnimatedNumberTick = {
  /** Monotonic tick id; slots animate exactly once per gen. */
  gen: number
  /** Chars of the previous value, for rendering the outgoing glyph of a roll. */
  prevChars: string[]
  dir: AnimatedNumberDirection
  commonPrefixLength: number
  /** Balance-change indication color for this tick, or undefined when no flash should show. */
  flashColor: string | undefined
}

export type ReanimatedNumberRenderProps = {
  chars: string[]
  tick: AnimatedNumberTick
  currency: FiatCurrencyInfo
  digitHeight: number
  digitCellWidth: number
  shouldFadeDecimals: boolean
  variantFont: ResolvedFontStyle
  baseColor: string
  decimalPartColor: string
  useHeadingTypography: boolean
  charDelays: number[]
  charShouldAnimate: boolean[]
  reduceMotion: boolean
}
