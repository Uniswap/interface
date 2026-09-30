import type { ResolvedFontStyle } from '@universe/mycelium'
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { ROLL_TRANSITION_MS, SLIDE_PERCENT } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { startFlashSequence } from 'uniswap/src/components/AnimatedNumber/native/startFlashSequence'
import { DigitGlyphStyles } from 'uniswap/src/components/AnimatedNumber/native/styles'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { useOnTick } from 'uniswap/src/components/AnimatedNumber/native/useOnTick'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'

/**
 * A single rolling digit. All inputs for one roll (current/outgoing glyph, direction, flash
 * color, roll id) arrive together in a single commit, and the roll starts exactly once per gen —
 * so a value change can never animate twice. All motion (roll + color flash) runs on the UI
 * thread via transform/opacity only; stagger uses withDelay instead of JS timers.
 *
 * One `rollProgress` shared value drives both glyphs: a screen-wide tick mounts many slots at once.
 * Mounted lazily by DigitCell on the first tick that rolls, so `fireOnMount` plays that tick.
 */
export function DigitSlot({
  digit,
  prevDigit,
  gen,
  dir,
  delay,
  baseColor,
  flashColor,
  digitHeight,
  variantFont,
  useHeadingTypography,
}: {
  digit: string
  /** Glyph the roll animates away from; equals `digit` for forced same-digit rolls. */
  prevDigit: string
  /** Roll id — the slot animates at most once per gen. */
  gen: number
  dir: AnimatedNumberDirection
  delay: number
  baseColor: string
  /** Balance-change indication color; the flash overlay cross-fades it in/out over the digit. */
  flashColor: string | undefined
  digitHeight: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
}): JSX.Element {
  // 1 = settled on the current glyph. Set to 0 and eased back to 1 for each roll.
  const rollProgress = useSharedValue(1)
  const flashOpacity = useSharedValue(0)

  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  const slideAmount = (SLIDE_PERCENT / 100) * digitHeight
  const isUp = dir === AnimatedNumberDirection.UP

  useOnTick({
    gen,
    fireOnMount: true,
    onTick: () => {
      if (dir === AnimatedNumberDirection.NONE) {
        rollProgress.value = 1
        flashOpacity.value = 0
        return
      }

      // Start position (synchronous), then the whole staggered roll runs on the UI thread.
      rollProgress.value = 0
      rollProgress.value = withDelay(delay, withTiming(1, { duration: ROLL_TRANSITION_MS }))

      if (flashColor != null) {
        startFlashSequence(flashOpacity)
      }
    },
  })

  const animatedPrevStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (isUp ? -slideAmount : slideAmount) * rollProgress.value }],
    opacity: 1 - rollProgress.value,
  }))

  const animatedCurrentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (isUp ? slideAmount : -slideAmount) * (1 - rollProgress.value) }],
    opacity: rollProgress.value,
  }))

  // Masked by rollProgress so the flash fades in with the incoming glyph (and waits out the stagger).
  const animatedFlashStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (isUp ? slideAmount : -slideAmount) * (1 - rollProgress.value) }],
    opacity: rollProgress.value * flashOpacity.value,
  }))

  // accessible={false} on all glyphs: the parent renders an invisible full-value Text as the
  // single screen-reader source, so the per-char animation copies must not be announced.
  return (
    <>
      <Animated.Text
        accessibilityElementsHidden
        accessible={false}
        allowFontScaling={false}
        importantForAccessibility="no-hide-descendants"
        style={[digitTextStyle, { color: baseColor }, animatedPrevStyle, DigitGlyphStyles.absolute]}
      >
        {prevDigit}
      </Animated.Text>
      <Animated.Text
        accessible={false}
        allowFontScaling={false}
        style={[digitTextStyle, { color: baseColor }, animatedCurrentStyle, DigitGlyphStyles.absolute]}
      >
        {digit}
      </Animated.Text>
      <Animated.Text
        accessibilityElementsHidden
        accessible={false}
        allowFontScaling={false}
        importantForAccessibility="no-hide-descendants"
        style={[digitTextStyle, { color: flashColor ?? baseColor }, animatedFlashStyle, DigitGlyphStyles.absolute]}
      >
        {digit}
      </Animated.Text>
    </>
  )
}
