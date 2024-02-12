import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics'
import { useEffect, useRef } from 'react'
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated'
import Svg, { Circle } from 'react-native-svg'
import { iconSizes } from 'ui/src/theme'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'wallet/src/features/transactions/contexts/SwapScreenContext'

export const HOLD_TO_SWAP_TIMEOUT = 3000

const BACKGROUND_STROKE_COLOR = '#F4D9F5'
const STROKE_COLOR = '#F16EF4'
const STROKE_WIDTH = 4
const WIDTH = iconSizes.icon20
const CIRCLE_LENGTH = WIDTH * Math.PI

export const PROGRESS_CIRCLE_SIZE = WIDTH + STROKE_WIDTH

const CIRCLE_PROPS = {
  cx: PROGRESS_CIRCLE_SIZE / 2,
  cy: PROGRESS_CIRCLE_SIZE / 2,
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

  const animatedProps = useAnimatedProps(
    () => ({
      strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
    }),
    [progress]
  )

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
      height={PROGRESS_CIRCLE_SIZE}
      viewBox={`0 0 ${PROGRESS_CIRCLE_SIZE} ${PROGRESS_CIRCLE_SIZE}`}
      width={PROGRESS_CIRCLE_SIZE}>
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
