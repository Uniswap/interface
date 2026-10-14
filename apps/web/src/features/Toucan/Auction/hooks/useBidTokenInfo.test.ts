import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'

const mockUseCurrencyInfoWithLoading = vi.fn()
const refetchCurrencyInfo = vi.fn()

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfoWithLoading: (...args: unknown[]) => mockUseCurrencyInfoWithLoading(...args),
}))

vi.mock('uniswap/src/features/transactions/hooks/useUSDCPrice', () => ({
  useUSDCPrice: () => ({ price: undefined }),
}))

const BID_TOKEN = { bidTokenAddress: '0x0000000000000000000000000000000000000001', chainId: UniverseChainId.Mainnet }

describe('useBidTokenInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: refetchCurrencyInfo,
    })
  })

  it('re-runs the bid currency lookup on refetch', () => {
    const { result } = renderHook(() => useBidTokenInfo(BID_TOKEN))
    result.current.refetch()
    expect(refetchCurrencyInfo).toHaveBeenCalledTimes(1)
  })

  it('leaves a skipped lookup idle on refetch and reports no error', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchCurrencyInfo,
    })
    const { result } = renderHook(() => useBidTokenInfo({ ...BID_TOKEN, skip: true }))
    result.current.refetch()
    expect(refetchCurrencyInfo).not.toHaveBeenCalled()
    expect(result.current.error).toBeUndefined()
  })

  it('reports an in-flight lookup as loading without an error', () => {
    const { result } = renderHook(() => useBidTokenInfo(BID_TOKEN))
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it('reports a lookup that settled without a currency as an error', () => {
    mockUseCurrencyInfoWithLoading.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
      refetch: refetchCurrencyInfo,
    })
    const { result } = renderHook(() => useBidTokenInfo(BID_TOKEN))
    expect(result.current.error).toBeInstanceOf(Error)
  })
})
