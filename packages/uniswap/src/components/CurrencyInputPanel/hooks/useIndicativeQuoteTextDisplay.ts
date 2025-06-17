import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { useEffect, useMemo, useRef } from 'react'
import { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'

export type PanelTextDisplay = {
  value: string | undefined
  color: '$neutral1' | '$neutral2' | '$neutral3'
  usdValue?: CurrencyAmount<Currency> | null
}

/**
 * Controls the display value and color upon indicative vs full quote input.
 *
 * Rules:
 * * If the value goes from indicative to full, show the indicative value for another 200ms in neutral2 before changing.
 * * If the value is undefined, but there is input, continue to show the previous value until it gets replaced by a new quote.
 */
export function useIndicativeQuoteTextDisplay({
  currencyAmount,
  focus,
  isLoading,
  usdValue,
  value,
  valueIsIndicative,
}: Pick<
  CurrencyInputPanelProps,
  'currencyAmount' | 'focus' | 'isLoading' | 'usdValue' | 'value' | 'valueIsIndicative'
>): PanelTextDisplay {
  const lastDisplayRef = useRef<PanelTextDisplay>({ value, color: '$neutral3', usdValue })
  const hasInput = Boolean(isLoading || currencyAmount)

  // Clear the lastDisplayRef if input is cleared, so that it is not used upon subsequent input
  useEffect(() => {
    if (!hasInput) {
      lastDisplayRef.current = { value: undefined, color: '$neutral3' }
    }
  }, [hasInput])

  return useMemo(() => {
    // Ignore all indicative treatment when the field is focused
    if (focus) {
      return { value, color: '$neutral1', usdValue }
    }

    if (!value) {
      return hasInput ? lastDisplayRef.current : { value, color: '$neutral3' }
    }

    const color = valueIsIndicative ? '$neutral3' : '$neutral1'

    const display = { value, color, usdValue } as const
    lastDisplayRef.current = display

    return display
  }, [focus, value, usdValue, hasInput, valueIsIndicative])
}
