import { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'
import { usePrevious } from 'utilities/src/react/hooks'

/** Returns an animated opacity based on current indicative and full quote state  */
export function useRefetchAnimationStyle({
  currencyAmount,
  isLoading,
  isIndicativeLoading,
  valueIsIndicative,
}: Pick<CurrencyInputPanelProps, 'currencyAmount' | 'isLoading' | 'isIndicativeLoading' | 'valueIsIndicative'>): {
  opacity: number
} {
  const loadingFlexProgress = useSharedValue(1)

  loadingFlexProgress.value = withRepeat(
    withSequence(
      withTiming(0.4, { duration: 400, easing: Easing.ease }),
      withTiming(1, { duration: 400, easing: Easing.ease }),
    ),
    -1,
    true,
  )

  const previousAmount = usePrevious(currencyAmount)

  const amountIsTheSame = currencyAmount && previousAmount?.equalTo(currencyAmount)
  const noIndicativeUI = !isIndicativeLoading && !valueIsIndicative

  // The component is 'refetching' the full quote when the amount hasn't changed, and there is no indicative UI being displayed.
  const isRefetching = isLoading && amountIsTheSame && noIndicativeUI

  return useAnimatedStyle(
    () => ({
      opacity: isRefetching ? loadingFlexProgress.value : 1,
    }),
    [isRefetching, loadingFlexProgress],
  )
}
