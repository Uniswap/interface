import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'

const mockUnderlyingTokenRead = vi.fn<(params: unknown) => { data: string | undefined; isLoading: boolean }>()
vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useReadContract: (params: unknown) => mockUnderlyingTokenRead(params),
}))

const CAP_RECEIPT_ADDRESS = '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999'
const CAP_UNDERLYING_ADDRESS = '0x2222222222222222222222222222222222222222'

describe('useAuctionTradingToken', () => {
  beforeEach(() => {
    mockUnderlyingTokenRead.mockReset().mockReturnValue({ data: CAP_UNDERLYING_ADDRESS, isLoading: false })
  })

  it.each([
    { chainId: UniverseChainId.Mainnet, tokenAddress: CAP_RECEIPT_ADDRESS },
    { chainId: UniverseChainId.ArbitrumOne, tokenAddress: '0xb628B89067E8f7Dfc2cB528a72BcfF7d5cEDcE29' },
    { chainId: UniverseChainId.Mainnet, tokenAddress: CAP_UNDERLYING_ADDRESS },
  ])('suppresses cached, overridden, and ordinary destinations while disabled: $tokenAddress', (token) => {
    const { result } = renderHook(() => useAuctionTradingToken({ ...token, enabled: false }))

    expect(result.current).toEqual({ tradingTokenAddress: undefined, loading: false })
    expect(mockUnderlyingTokenRead).toHaveBeenCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ enabled: false }) }),
    )
  })

  it('resolves the underlying destination when its consumer becomes enabled', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useAuctionTradingToken({ chainId: UniverseChainId.Mainnet, tokenAddress: CAP_RECEIPT_ADDRESS, enabled }),
      { initialProps: { enabled: false } },
    )

    expect(result.current.tradingTokenAddress).toBeUndefined()

    rerender({ enabled: true })

    expect(result.current).toEqual({ tradingTokenAddress: CAP_UNDERLYING_ADDRESS, loading: false })
    expect(mockUnderlyingTokenRead).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: expect.objectContaining({ enabled: true }) }),
    )
  })

  it('preserves resolution for callers that omit enabled', () => {
    const { result } = renderHook(() =>
      useAuctionTradingToken({ chainId: UniverseChainId.Mainnet, tokenAddress: CAP_RECEIPT_ADDRESS }),
    )

    expect(result.current).toEqual({ tradingTokenAddress: CAP_UNDERLYING_ADDRESS, loading: false })
  })
})
