import type { ResolvedFontStyle } from '@universe/mycelium'
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
  /** Balance-change indication color for this tick; undefined when no flash should show (always when dir is NONE). */
  flashColor: string | undefined
}

/** A digit cell's roll request for the current tick. `gen` 0 means the tick doesn't touch this cell. */
export type CellRoll = {
  gen: number
  dir: AnimatedNumberDirection
  flashColor: string | undefined
  delay: number
}

/** A non-digit cell's flash request for the current tick. `gen` 0 means the tick doesn't flash this cell. */
export type CellFlash = {
  gen: number
  color: string | undefined
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
  /** See AnimatedNumberProps.suspendAnimations — layout unchanged, all animation work skipped. */
  suspendAnimations: boolean
}
