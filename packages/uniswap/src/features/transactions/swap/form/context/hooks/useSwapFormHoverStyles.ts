import { useMemo } from 'react'
import type { FlexProps } from 'ui/src'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { CurrencyField } from 'uniswap/src/types/currency'

type HoverStyles = {
  input: FlexProps['hoverStyle']
  output: FlexProps['hoverStyle']
}

export const useSwapFormHoverStyles = (): HoverStyles => {
  const { focusOnCurrencyField } = useSwapFormContext()

  return useMemo<HoverStyles>(
    () => ({
      input: {
        borderColor: focusOnCurrencyField === CurrencyField.INPUT ? '$surface3Hovered' : '$transparent',
        backgroundColor: focusOnCurrencyField === CurrencyField.INPUT ? '$surface1' : '$surface2Hovered',
      },
      output: {
        borderColor: focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface3Hovered' : '$transparent',
        backgroundColor: focusOnCurrencyField === CurrencyField.OUTPUT ? '$surface1' : '$surface2Hovered',
      },
    }),
    [focusOnCurrencyField],
  )
}
