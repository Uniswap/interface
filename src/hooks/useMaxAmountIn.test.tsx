import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { renderHook } from 'test-utils/render'

import { useMaxAmountIn } from './useMaxAmountIn'

describe('useMaxAmountIn', () => {
  it('returns undefined for an undefined trade', () => {
    const { result } = renderHook(() => useMaxAmountIn(undefined, TEST_ALLOWED_SLIPPAGE))
    expect(result.current).toEqual(undefined)
  })

  it('returns the expected value calculated using the exact-input trade and the given slippage', () => {
    const { result } = renderHook(() => useMaxAmountIn(TEST_TRADE_EXACT_INPUT, TEST_ALLOWED_SLIPPAGE))
    const expectedResult = TEST_TRADE_EXACT_INPUT.maximumAmountIn(TEST_ALLOWED_SLIPPAGE)
    expect(result.current?.toExact()).toEqual(expectedResult?.toExact())
  })
})
