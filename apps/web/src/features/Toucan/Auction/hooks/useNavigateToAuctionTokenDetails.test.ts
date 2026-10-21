import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import { useNavigateToAuctionTokenDetails } from '~/features/Toucan/Auction/hooks/useNavigateToAuctionTokenDetails'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

const mockNavigate = vi.fn()
const mockPrefetchAuction = vi.fn()
vi.mock('react-router', () => ({ useNavigate: () => mockNavigate }))
vi.mock('~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction', () => ({
  usePrefetchTokenDetailsAuction: () => mockPrefetchAuction,
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({ useAuctionDisplayState: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionTradingToken', () => ({ useAuctionTradingToken: vi.fn() }))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))

const TOKEN_ADDRESS = '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904'
const mockStoreState = { auctionDetails: { chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS } }
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

describe('useNavigateToAuctionTokenDetails', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockPrefetchAuction.mockReset()
    vi.mocked(sendAnalyticsEvent).mockReset()
    vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)
    vi.mocked(useAuctionTradingToken).mockReset()
    vi.mocked(useAuctionTradingToken).mockImplementation(({ tokenAddress, enabled }) => ({
      tradingTokenAddress: enabled ? tokenAddress : undefined,
      loading: false,
    }))
    mockStoreState.auctionDetails = { chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS }
  })

  it.each([
    { chainId: UniverseChainId.Mainnet, chainUrlParam: 'ethereum' },
    { chainId: UniverseChainId.UnichainSepolia, chainUrlParam: 'unichain_sepolia' },
  ])(
    'warms the lookup and navigates to $chainUrlParam without a display state, skipping only the event',
    ({ chainId, chainUrlParam }) => {
      mockStoreState.auctionDetails.chainId = chainId
      vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)
      const { result } = renderHook(() => useNavigateToAuctionTokenDetails({ enabled: true }))

      result.current.navigateToTokenDetails()

      expect(useAuctionTradingToken).toHaveBeenCalledWith({ chainId, tokenAddress: TOKEN_ADDRESS, enabled: true })
      expect(mockPrefetchAuction).toHaveBeenCalledWith({ chainId, tokenAddress: TOKEN_ADDRESS })
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate.mock.calls[0]?.[0]).toMatch(
        new RegExp(`^/explore/tokens/${chainUrlParam}/${TOKEN_ADDRESS}$`, 'i'),
      )
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    },
  )

  it.each([
    {
      name: 'CAP',
      chainId: UniverseChainId.Mainnet,
      chainUrlParam: 'ethereum',
      receiptAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
      tradingTokenAddress: '0x2222222222222222222222222222222222222222',
    },
    {
      name: 'IDOS',
      chainId: UniverseChainId.ArbitrumOne,
      chainUrlParam: 'arbitrum',
      receiptAddress: '0xb628b89067e8f7dfc2cb528a72bcff7d5cedce29',
      tradingTokenAddress: '0x68731d6f14b827bbcffbebb62b19daa18de1d79c',
    },
  ])(
    'prefetches and navigates to the resolved $name trading token',
    ({ chainId, chainUrlParam, receiptAddress, tradingTokenAddress }) => {
      mockStoreState.auctionDetails = { chainId, tokenAddress: receiptAddress }
      vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress, loading: false })
      vi.mocked(useAuctionDisplayState).mockReturnValue({
        phase: AuctionDisplayPhase.Ended,
        result: AuctionDisplayResult.Successful,
        poolAvailability: PoolAvailability.HasPool,
        shouldShowSwap: true,
      })
      const { result } = renderHook(() => useNavigateToAuctionTokenDetails({ enabled: true }))

      result.current.prefetchTokenDetails()
      result.current.navigateToTokenDetails()

      expect(useAuctionTradingToken).toHaveBeenCalledWith({ chainId, tokenAddress: receiptAddress, enabled: true })
      expect(mockPrefetchAuction).toHaveBeenCalledTimes(2)
      expect(mockPrefetchAuction).toHaveBeenCalledWith({ chainId, tokenAddress: tradingTokenAddress })
      expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/${chainUrlParam}/${tradingTokenAddress}`)
      expect(sendAnalyticsEvent).toHaveBeenCalledWith(
        AuctionEventName.AuctionDetailsToTokenDetailsClicked,
        expect.objectContaining({ chain_id: chainId, auction_phase: 'ended', pool_availability: 'has_pool' }),
      )
    },
  )

  it('resolves and navigates only when its trade surface becomes visible', () => {
    const { result, rerender } = renderHook(({ enabled }) => useNavigateToAuctionTokenDetails({ enabled }), {
      initialProps: { enabled: false },
    })

    result.current.prefetchTokenDetails()
    result.current.navigateToTokenDetails()

    expect(useAuctionTradingToken).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
      enabled: false,
    })
    expect(mockPrefetchAuction).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    rerender({ enabled: true })
    result.current.navigateToTokenDetails()

    expect(useAuctionTradingToken).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
      enabled: true,
    })
    expect(mockPrefetchAuction).toHaveBeenCalledExactlyOnceWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
    })
    expect(mockNavigate).toHaveBeenCalledExactlyOnceWith(`/explore/tokens/ethereum/${TOKEN_ADDRESS}`)
  })

  it.each(['auction_now_trading_card', 'adp_trade_token_banner'] as const)(
    'shares the exact allowlisted impression payload with clicks from %s',
    (entryPoint) => {
      const displayState = {
        phase: AuctionDisplayPhase.Ended,
        result: AuctionDisplayResult.Successful,
        poolAvailability: PoolAvailability.HasPool,
        shouldShowSwap: true,
        tokenAddress: TOKEN_ADDRESS,
        walletAddress: '0x1111111111111111111111111111111111111111',
      }
      vi.mocked(useAuctionDisplayState).mockReturnValue(displayState)
      const { result } = renderHook(() => useNavigateToAuctionTokenDetails({ enabled: true, entryPoint }))
      const impressionProperties = result.current.analyticsProperties

      result.current.navigateToTokenDetails()

      expect(impressionProperties).toEqual({
        surface: 'adp',
        chain_id: UniverseChainId.Mainnet,
        auction_type: 'unknown',
        launch_method: 'unknown',
        entry_point: entryPoint,
        auction_phase: 'ended',
        pool_availability: 'has_pool',
        page_layout: 'trading',
      })
      expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
        AuctionEventName.AuctionDetailsToTokenDetailsClicked,
        impressionProperties,
      )
      expect(vi.mocked(sendAnalyticsEvent).mock.calls[0]?.[1]).toBe(impressionProperties)
    },
  )

  it.each([true, false])(
    'skips prefetch, navigation, and click analytics without a resolved trading token (loading: %s)',
    (loading) => {
      vi.mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: undefined, loading })
      vi.mocked(useAuctionDisplayState).mockReturnValue({
        phase: AuctionDisplayPhase.Ended,
        result: AuctionDisplayResult.Successful,
        poolAvailability: PoolAvailability.Loading,
        shouldShowSwap: true,
      })
      const { result } = renderHook(() => useNavigateToAuctionTokenDetails({ enabled: true }))

      result.current.prefetchTokenDetails()
      result.current.navigateToTokenDetails()

      expect(mockPrefetchAuction).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
      expect(sendAnalyticsEvent).not.toHaveBeenCalled()
    },
  )
})
