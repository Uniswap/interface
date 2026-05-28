import { renderHook } from 'test-utils/render'

import { FeeAmount } from '@uniswap/v3-sdk'
import { PoolState, useComputePoolState } from 'hooks/usePools'
import { USDC, USDT } from 'uniswap/src/constants/tokens'

describe('useComputePoolState', () => {
  it('should return loading state when loading', () => {
    const { result } = renderHook(() =>
      useComputePoolState([[undefined, undefined, undefined]], undefined, true, undefined, true, []),
    )
    expect(result.current).toEqual([[PoolState.LOADING, null]])
  })

  it('should return invalid state when tokens are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState([[undefined, undefined, undefined]], undefined, false, undefined, false, []),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return invalid state when slot0s are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState([[undefined, undefined, undefined]], undefined, false, undefined, false, []),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return invalid state when liquidities are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState([[undefined, undefined, undefined]], undefined, false, undefined, false, []),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return not exists state when slot0s are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState(
        [[USDT, USDC, FeeAmount.MEDIUM]],
        [{ error: new Error('test'), status: 'failure', result: undefined }],
        false,
        [{ error: new Error('test'), status: 'failure', result: undefined }],
        false,
        [[USDT, USDC, FeeAmount.MEDIUM]],
      ),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return not exists state when liquidities are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState(
        [[USDT, USDC, FeeAmount.MEDIUM]],
        [{ status: 'success', result: [1n, 0, 0, 0, 0, 0, false] }],
        false,
        [{ error: new Error('test'), status: 'failure', result: undefined }],
        false,
        [[USDT, USDC, FeeAmount.MEDIUM]],
      ),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return not exists when sqrtPriceX96 is 0', () => {
    const { result } = renderHook(() =>
      useComputePoolState(
        [[USDT, USDC, FeeAmount.MEDIUM]],
        [{ status: 'success', result: [0n, 0, 0, 0, 0, 0, false] }],
        false,
        [{ status: 'success', result: 1n }],
        false,
        [[USDT, USDC, FeeAmount.MEDIUM]],
      ),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return pool', () => {
    const { result } = renderHook(() =>
      useComputePoolState(
        [[USDT, USDC, FeeAmount.MEDIUM]],
        [{ status: 'success', result: [73077421104018785031263082221n, -1617, 58, 180, 180, 0, true] }],
        false,
        [{ status: 'success', result: 1n }],
        false,
        [[USDT, USDC, FeeAmount.MEDIUM]],
      ),
    )
    expect(result.current[0][0]).toEqual(PoolState.EXISTS)
  })
})
