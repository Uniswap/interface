import { useMemo } from 'react'
import { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'
import { usePrevious } from 'utilities/src/react/hooks'
import { useInjectSingleStylesheet } from 'utilities/src/react/useInjectSingleStylesheet'

const PULSE_KEYFRAMES_NAME = 'uniswap-refetch-pulse-animation'
const PULSE_KEYFRAMES_CSS = `
    @keyframes ${PULSE_KEYFRAMES_NAME} {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `

/**
 * Web-specific hook that returns a CSS-based opacity animation style.
 *
 * Returns a style object with CSS animation property when refetching,
 * otherwise returns opacity: 1 for static display.
 */
export function useRefetchAnimationStyle({
  currencyAmount,
  isLoading,
  isIndicativeLoading,
  valueIsIndicative,
}: Pick<CurrencyInputPanelProps, 'currencyAmount' | 'isLoading' | 'isIndicativeLoading' | 'valueIsIndicative'>): {
  opacity?: number
  animation?: string
} {
  useInjectSingleStylesheet({ id: PULSE_KEYFRAMES_NAME, css: PULSE_KEYFRAMES_CSS })

  const previousAmount = usePrevious(currencyAmount)

  const amountIsTheSame = currencyAmount && previousAmount?.equalTo(currencyAmount)
  const noIndicativeUI = !isIndicativeLoading && !valueIsIndicative

  // The component is 'refetching' the full quote when the amount hasn't changed, and there is no indicative UI being displayed.
  const isRefetching = isLoading && amountIsTheSame && noIndicativeUI

  return useMemo(
    () =>
      isRefetching
        ? ({
            animation: `${PULSE_KEYFRAMES_NAME} 800ms ease-in-out infinite`,
          } as { opacity?: number; animation?: string })
        : { opacity: 1 },
    [isRefetching],
  )
}
