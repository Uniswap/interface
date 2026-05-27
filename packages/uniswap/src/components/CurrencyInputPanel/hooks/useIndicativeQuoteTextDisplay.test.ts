import { useIndicativeQuoteTextDisplay } from 'uniswap/src/components/CurrencyInputPanel/hooks/useIndicativeQuoteTextDisplay'
import type { CurrencyInputPanelProps } from 'uniswap/src/components/CurrencyInputPanel/types'
import { renderHook } from 'uniswap/src/test/test-utils'

type HookArgs = Pick<
  CurrencyInputPanelProps,
  'currencyAmount' | 'focus' | 'isLoading' | 'usdValue' | 'value' | 'valueIsIndicative'
>

const baseArgs: HookArgs = {
  currencyAmount: undefined,
  focus: false,
  isLoading: false,
  usdValue: undefined,
  value: undefined,
  valueIsIndicative: false,
}

describe(useIndicativeQuoteTextDisplay, () => {
  it('returns an empty placeholder display when there is no value and no input', () => {
    const { result } = renderHook(() => useIndicativeQuoteTextDisplay(baseArgs))

    expect(result.current).toEqual({ value: undefined, color: '$neutral3' })
  })

  it('returns the value in neutral1 when a full quote value is provided', () => {
    const { result } = renderHook(() => useIndicativeQuoteTextDisplay({ ...baseArgs, value: '1.23' }))

    expect(result.current).toEqual({ value: '1.23', color: '$neutral1', usdValue: undefined })
  })

  it('clears the previous value while a new quote is loading', () => {
    const { result, rerender } = renderHook(useIndicativeQuoteTextDisplay, {
      initialProps: [{ ...baseArgs, value: '1.23' }],
    })

    expect(result.current.value).toBe('1.23')

    // Simulate the user changing the input amount: the derived value becomes empty
    // and a new quote starts fetching.
    rerender([{ ...baseArgs, value: undefined, isLoading: true }])

    expect(result.current).toEqual({ value: undefined, color: '$neutral3' })
  })

  it('keeps showing the focused value in neutral1 regardless of loading state', () => {
    const { result } = renderHook(() =>
      useIndicativeQuoteTextDisplay({ ...baseArgs, value: '1.23', focus: true, isLoading: true }),
    )

    expect(result.current).toEqual({ value: '1.23', color: '$neutral1', usdValue: undefined })
  })
})
