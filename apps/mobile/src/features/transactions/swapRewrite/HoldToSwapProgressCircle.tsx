import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { useEffect, useRef } from 'react'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { iconSizes } from 'ui/src/theme'

export const HOLD_TO_SWAP_TIMEOUT = 3000

const BACKGROUND_STROKE_COLOR = '#F16EF4'
const STROKE_COLOR = '#FFFFFF'
const STROKE_WIDTH = 4
const WIDTH = iconSizes.icon20
const WIDTH_WITH_STROKE = WIDTH + STROKE_WIDTH
const CIRCLE_LENGTH = WIDTH * Math.PI

const CIRCLE_PROPS = {
  cx: WIDTH_WITH_STROKE / 2,
  cy: WIDTH_WITH_STROKE / 2,
  r: WIDTH / 2,
  strokeDasharray: CIRCLE_LENGTH,
  strokeLinecap: 'round',
  strokeWidth: STROKE_WIDTH,
} as const

const AnimatedCircle = Animated.createAnimatedComponent(Circle)

export function HoldToSwapProgressCircle(): JSX.Element {
  const { screen } = useSwapScreenContext()

  useHapticFeedback()

  const isHoldToSwapPressed = screen === SwapScreen.SwapReviewHoldingToSwap

  const progress = useSharedValue(0)

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }))

  useEffect(() => {
    if (isHoldToSwapPressed) {
      progress.value = withTiming(progress.value > 0 ? 0 : 1, {
        // To make the transition feel smoother, we add a little extra time to the animation.
        duration: HOLD_TO_SWAP_TIMEOUT + 250,
      })
    } else {
      progress.value = 0
    }
  }, [isHoldToSwapPressed, progress])

  return (
    <Svg
      fill="none"
      height={WIDTH_WITH_STROKE}
      viewBox={`0 0 ${WIDTH_WITH_STROKE} ${WIDTH_WITH_STROKE}`}
      width={WIDTH_WITH_STROKE}>
      <Circle {...CIRCLE_PROPS} stroke={BACKGROUND_STROKE_COLOR} />
      <AnimatedCircle animatedProps={animatedProps} {...CIRCLE_PROPS} stroke={STROKE_COLOR} />
    </Svg>
  )
}

// This triggers haptic feedback at 0, 1 and 2 seconds in increasing intensity.
function useHapticFeedback(): void {
  const impactCount = useRef(0)

  useEffect(() => {
    impactCount.current += 1
    impactAsync(ImpactFeedbackStyle.Light).catch(() => undefined)

    const hapticImpactInterval = HOLD_TO_SWAP_TIMEOUT / 3

    const timeout = setInterval(async () => {
      impactCount.current += 1

      if (impactCount.current === 2) {
        impactAsync(ImpactFeedbackStyle.Medium).catch(() => undefined)
      } else {
        impactAsync(ImpactFeedbackStyle.Heavy).catch(() => undefined)
        clearInterval(timeout)
      }
    }, hapticImpactInterval)

    return () => clearInterval(timeout)
  }, [])
}
