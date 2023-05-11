import { TEST_ALLOWED_SLIPPAGE, TEST_TRADE_EXACT_INPUT } from 'test-utils/constants'
import { renderHook } from 'test-utils/render'

import { useMaxAmountIn } from './useMaxAmountIn'

describe('useMaxAmountIn', () => {
  it('should return undefined', () => {
    const { result } = renderHook(() => useMaxAmountIn(undefined, TEST_ALLOWED_SLIPPAGE))
    expect(result.current).toEqual(undefined)
  })

  it('should return correct value for token', () => {
    const { result } = renderHook(() => useMaxAmountIn(TEST_TRADE_EXACT_INPUT, TEST_ALLOWED_SLIPPAGE))
    expect(result.current?.toExact()).toEqual('0.000000000000001')
  })
})
