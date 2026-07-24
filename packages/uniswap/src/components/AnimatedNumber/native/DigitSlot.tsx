import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import type { ResolvedFontStyle } from 'ui/src/theme'
import { ROLL_TRANSITION_MS, SLIDE_PERCENT } from 'uniswap/src/components/AnimatedNumber/animationConfig'
import { startFlashSequence } from 'uniswap/src/components/AnimatedNumber/native/startFlashSequence'
import { useDigitTextStyle } from 'uniswap/src/components/AnimatedNumber/native/useDigitTextStyle'
import { useOnTick } from 'uniswap/src/components/AnimatedNumber/native/useOnTick'
import { AnimatedNumberDirection } from 'uniswap/src/components/AnimatedNumber/types'

const absoluteStyle = { position: 'absolute', top: 1, width: '100%', textAlign: 'center' } as const

/**
 * A single rolling digit. All inputs for one roll (current/outgoing glyph, direction, flash
 * color, tick id) arrive together in a single commit, and the roll starts exactly once per tick —
 * so a value change can never animate twice. All motion (roll + color flash) runs on the UI
 * thread via transform/opacity only; stagger uses withDelay instead of JS timers.
 */
export function DigitSlot({
  digit,
  prevDigit,
  gen,
  shouldRoll,
  dir,
  delay,
  baseColor,
  flashColor,
  reduceMotion,
  digitHeight,
  variantFont,
  useHeadingTypography,
}: {
  digit: string
  /** Glyph the roll animates away from; equals `digit` for forced same-digit rolls. */
  prevDigit: string
  /** Tick id — the slot animates at most once per gen. */
  gen: number
  shouldRoll: boolean
  dir: AnimatedNumberDirection
  delay: number
  baseColor: string
  /** Balance-change indication color; the flash overlay cross-fades it in/out over the digit. */
  flashColor: string | undefined
  reduceMotion: boolean
  digitHeight: number
  variantFont: ResolvedFontStyle
  useHeadingTypography: boolean
}): JSX.Element {
  const prevTranslateY = useSharedValue(0)
  const prevOpacity = useSharedValue(0)
  const currentTranslateY = useSharedValue(0)
  const currentOpacity = useSharedValue(1)
  const flashOpacity = useSharedValue(0)

  const digitTextStyle = useDigitTextStyle({ variantFont, digitHeight, useHeadingTypography })

  useOnTick(gen, () => {
    if (!shouldRoll || reduceMotion || dir === AnimatedNumberDirection.NONE) {
      currentTranslateY.value = 0
      currentOpacity.value = 1
      prevOpacity.value = 0
      return
    }

    const slideAmount = (SLIDE_PERCENT / 100) * digitHeight
    const isUp = dir === AnimatedNumberDirection.UP

    // Start positions (synchronous), then the whole staggered roll runs on the UI thread.
    currentTranslateY.value = isUp ? slideAmount : -slideAmount
    currentOpacity.value = 0
    prevTranslateY.value = 0
    prevOpacity.value = 1

    currentTranslateY.value = withDelay(delay, withTiming(0, { duration: ROLL_TRANSITION_MS }))
    currentOpacity.value = withDelay(delay, withTiming(1, { duration: ROLL_TRANSITION_MS }))
    prevTranslateY.value = withDelay(
      delay,
      withTiming(isUp ? -slideAmount : slideAmount, { duration: ROLL_TRANSITION_MS }),
    )
    prevOpacity.value = withDelay(delay, withTiming(0, { duration: ROLL_TRANSITION_MS }))

    if (flashColor != null) {
      startFlashSequence(flashOpacity)
    }
  })

  const animatedPrevStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: prevTranslateY.value }],
    opacity: prevOpacity.value,
  }))

  const animatedCurrentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: currentTranslateY.value }],
    opacity: currentOpacity.value,
  }))

  // Tracks the current digit's roll so the flash reads as a color fade on the same glyph.
  const animatedFlashStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: currentTranslateY.value }],
    opacity: currentOpacity.value * flashOpacity.value,
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
        style={[digitTextStyle, { color: baseColor }, animatedPrevStyle, absoluteStyle]}
      >
        {prevDigit}
      </Animated.Text>
      <Animated.Text
        accessible={false}
        allowFontScaling={false}
        style={[digitTextStyle, { color: baseColor }, animatedCurrentStyle, absoluteStyle]}
      >
        {digit}
      </Animated.Text>
      <Animated.Text
        accessibilityElementsHidden
        accessible={false}
        allowFontScaling={false}
        importantForAccessibility="no-hide-descendants"
        style={[digitTextStyle, { color: flashColor ?? baseColor }, animatedFlashStyle, absoluteStyle]}
      >
        {digit}
      </Animated.Text>
    </>
  )
}
