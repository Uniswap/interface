import { FeeAmount } from '@uniswap/v3-sdk'
import { PoolState, useComputePoolState } from 'hooks/usePools'
import { renderHook } from 'test-utils/render'
import { USDC, USDT } from 'uniswap/src/constants/tokens'

describe('useComputePoolState', () => {
  it('should return loading state when loading', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[undefined, undefined, undefined]],
        slot0s: undefined,
        slot0sLoading: true,
        liquidities: undefined,
        liquiditiesLoading: true,
        poolTokens: [],
      }),
    )
    expect(result.current).toEqual([[PoolState.LOADING, null]])
  })

  it('should return invalid state when tokens are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[undefined, undefined, undefined]],
        slot0s: undefined,
        slot0sLoading: false,
        liquidities: undefined,
        liquiditiesLoading: false,
        poolTokens: [],
      }),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return invalid state when slot0s are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[undefined, undefined, undefined]],
        slot0s: undefined,
        slot0sLoading: false,
        liquidities: undefined,
        liquiditiesLoading: false,
        poolTokens: [],
      }),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return invalid state when liquidities are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[undefined, undefined, undefined]],
        slot0s: undefined,
        slot0sLoading: false,
        liquidities: undefined,
        liquiditiesLoading: false,
        poolTokens: [],
      }),
    )
    expect(result.current).toEqual([[PoolState.INVALID, null]])
  })

  it('should return not exists state when slot0s are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[USDT, USDC, FeeAmount.MEDIUM]],
        slot0s: [{ error: new Error('test'), status: 'failure', result: undefined }],
        slot0sLoading: false,
        liquidities: [{ error: new Error('test'), status: 'failure', result: undefined }],
        liquiditiesLoading: false,
        poolTokens: [[USDT, USDC, FeeAmount.MEDIUM]],
      }),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return not exists state when liquidities are undefined', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[USDT, USDC, FeeAmount.MEDIUM]],
        slot0s: [{ status: 'success', result: [1n, 0, 0, 0, 0, 0, false] }],
        slot0sLoading: false,
        liquidities: [{ error: new Error('test'), status: 'failure', result: undefined }],
        liquiditiesLoading: false,
        poolTokens: [[USDT, USDC, FeeAmount.MEDIUM]],
      }),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return not exists when sqrtPriceX96 is 0', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[USDT, USDC, FeeAmount.MEDIUM]],
        slot0s: [{ status: 'success', result: [0n, 0, 0, 0, 0, 0, false] }],
        slot0sLoading: false,
        liquidities: [{ status: 'success', result: 1n }],
        liquiditiesLoading: false,
        poolTokens: [[USDT, USDC, FeeAmount.MEDIUM]],
      }),
    )
    expect(result.current).toEqual([[PoolState.NOT_EXISTS, null]])
  })

  it('should return pool', () => {
    const { result } = renderHook(() =>
      useComputePoolState({
        poolKeys: [[USDT, USDC, FeeAmount.MEDIUM]],
        slot0s: [{ status: 'success', result: [73077421104018785031263082221n, -1617, 58, 180, 180, 0, true] }],
        slot0sLoading: false,
        liquidities: [{ status: 'success', result: 1n }],
        liquiditiesLoading: false,
        poolTokens: [[USDT, USDC, FeeAmount.MEDIUM]],
      }),
    )
    expect(result.current[0][0]).toEqual(PoolState.EXISTS)
  })
})
