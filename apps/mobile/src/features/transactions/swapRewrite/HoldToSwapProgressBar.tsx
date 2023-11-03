import { useEffect } from 'react'
import {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { HOLD_TO_SWAP_TIMEOUT } from 'src/features/transactions/swapRewrite/SwapFormButton'
import { AnimatedFlex } from 'ui/src'

export function HoldToSwapProgressBar(): JSX.Element {
  const { screen } = useSwapScreenContext()

  const isHoldToSwapPressed = screen === SwapScreen.SwapReviewHoldingToSwap

  const progressBarAnimatedWidth = useSharedValue(0)

  useEffect(() => {
    if (isHoldToSwapPressed) {
      progressBarAnimatedWidth.value = 1
    } else {
      progressBarAnimatedWidth.value = 0
    }
  }, [isHoldToSwapPressed, progressBarAnimatedWidth])

  const searchBoxAnimatedStyle = useAnimatedStyle(() => {
    const interpolatedWidth = interpolate(progressBarAnimatedWidth.value, [0, 1], [0, 100], {
      extrapolateRight: Extrapolation.CLAMP,
    })
    return {
      width: withTiming(`${interpolatedWidth}%`, {
        // To make the transition feel smoother, we add a little extra time to the animation.
        duration: isHoldToSwapPressed ? HOLD_TO_SWAP_TIMEOUT + 250 : 0,
      }),
    }
  }, [isHoldToSwapPressed])

  if (!isHoldToSwapPressed) {
    return <></>
  }

  return (
    <AnimatedFlex
      alignSelf="center"
      bg="magenta"
      borderRadius="$rounded16"
      height="$spacing4"
      mb="$spacing24"
      mt="$spacing16"
      style={searchBoxAnimatedStyle}
      zIndex="$popover"
    />
  )
}
