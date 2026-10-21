import { renderHook } from '@testing-library/react'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import { useAuctionTradingToken } from '~/features/Toucan/Auction/hooks/useAuctionTradingToken'
import type { AuctionDetails, AuctionStoreState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import {
  shouldShowClaimOnlyTimeline,
  shouldShowNowTradingCard,
} from '~/features/Toucan/Auction/utils/auctionDisplayVisibility'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { shouldShowTokenLaunchedBanner } from '~/features/Toucan/Auction/utils/tokenLaunchedBannerUtils'
import { mocked } from '~/test-utils/mocked'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: vi.fn(),
}))

vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: vi.fn(),
}))

vi.mock('~/features/Toucan/Auction/hooks/useAuctionTradingToken', () => ({
  useAuctionTradingToken: vi.fn(),
}))

const auctionDetails = {
  chainId: 1,
  tokenAddress: '0xtoken',
  address: '0xauction',
  startBlock: '10',
  endBlock: '20',
} as unknown as AuctionDetails

function mockStore({
  auctionDetails: details,
  currentBlockNumber,
}: {
  auctionDetails: AuctionDetails | null
  currentBlockNumber?: number
}): void {
  mocked(useAuctionStore).mockImplementation((selector) =>
    selector({ auctionDetails: details, currentBlockNumber } as unknown as Omit<AuctionStoreState, 'actions'>),
  )
}

describe('useAuctionDisplayState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useAuctionTradingToken).mockImplementation(({ tokenAddress, enabled }) => ({
      tradingTokenAddress: enabled ? tokenAddress : undefined,
      loading: false,
    }))
    mocked(useAuctionDisplayDataSources).mockReturnValue({
      currentBlock: { status: 'loading' },
      currencyRaised: { status: 'idle' },
      pools: { status: 'loading' },
    } as ReturnType<typeof useAuctionDisplayDataSources>)
  })

  it('returns undefined and keeps the sources disabled while the flag is off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mockStore({ auctionDetails, currentBlockNumber: 15 })

    const { result } = renderHook(() => useAuctionDisplayState())

    expect(useFeatureFlag).toHaveBeenCalledWith(FeatureFlags.TokenProvenance)
    expect(useAuctionTradingToken).toHaveBeenCalledWith({
      chainId: auctionDetails.chainId,
      tokenAddress: auctionDetails.tokenAddress,
      enabled: false,
    })
    expect(useAuctionDisplayDataSources).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
    expect(result.current).toBeUndefined()
  })

  it('keeps the sources disabled without auction details', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStore({ auctionDetails: null })

    const { result } = renderHook(() => useAuctionDisplayState())

    expect(useAuctionDisplayDataSources).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false, currentBlock: { status: 'loading' } }),
    )
    expect(result.current?.phase).toBe(AuctionDisplayPhase.Unknown)
  })

  it('feeds the store block into the sources and resolves the display state', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStore({ auctionDetails, currentBlockNumber: 15 })
    mocked(useAuctionDisplayDataSources).mockReturnValue({
      currentBlock: { status: 'success', blockNumber: 15n },
      currencyRaised: { status: 'idle' },
      pools: { status: 'success', poolCount: 0 },
      refetchCurrentBlock: vi.fn(),
      refetchCheckpoint: vi.fn(),
    })

    const { result } = renderHook(() => useAuctionDisplayState())

    expect(useAuctionDisplayDataSources).toHaveBeenCalledWith({
      chainId: 1,
      tokenAddress: '0xtoken',
      auctionAddress: '0xauction',
      startBlock: '10',
      endBlock: '20',
      enabled: true,
      currentBlock: { status: 'success', blockNumber: 15n },
    })
    expect(result.current).toMatchObject({
      phase: AuctionDisplayPhase.Live,
      poolAvailability: PoolAvailability.NoPool,
      shouldShowSwap: false,
    })
  })

  it.each([
    {
      name: 'CAP',
      chainId: UniverseChainId.Mainnet,
      receiptAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
      tradingTokenAddress: '0x2222222222222222222222222222222222222222',
    },
    {
      name: 'IDOS',
      chainId: UniverseChainId.ArbitrumOne,
      receiptAddress: '0xb628b89067e8f7dfc2cb528a72bcff7d5cedce29',
      tradingTokenAddress: '0x68731d6f14b827bbcffbebb62b19daa18de1d79c',
    },
  ] as const)(
    'checks pools for the resolved $name trading token',
    ({ chainId, receiptAddress, tradingTokenAddress }) => {
      mocked(useFeatureFlag).mockReturnValue(true)
      mockStore({
        auctionDetails: { ...auctionDetails, chainId, tokenAddress: receiptAddress, requiredCurrencyRaised: '1' },
        currentBlockNumber: 25,
      })
      mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress, loading: false })
      mocked(useAuctionDisplayDataSources).mockReturnValue({
        currentBlock: { status: 'success', blockNumber: 25n },
        currencyRaised: { status: 'success', currencyRaised: '1' },
        pools: { status: 'success', poolCount: 1 },
        refetchCurrentBlock: vi.fn(),
        refetchCheckpoint: vi.fn(),
      })

      const { result } = renderHook(() => useAuctionDisplayState())

      expect(useAuctionTradingToken).toHaveBeenCalledWith({ chainId, tokenAddress: receiptAddress, enabled: true })
      expect(useAuctionDisplayDataSources).toHaveBeenCalledWith(
        expect.objectContaining({ chainId, tokenAddress: tradingTokenAddress, enabled: true }),
      )
      expect(result.current).toMatchObject({
        phase: AuctionDisplayPhase.Ended,
        result: AuctionDisplayResult.Successful,
        poolAvailability: PoolAvailability.HasPool,
        shouldShowSwap: true,
      })
    },
  )

  it.each([
    { loading: true, poolAvailability: PoolAvailability.Loading },
    { loading: false, poolAvailability: PoolAvailability.NoPool },
  ])(
    'keeps phase and outcome sources enabled without falling back to receipt pools when resolution is unavailable (loading: $loading)',
    ({ loading, poolAvailability }) => {
      mocked(useFeatureFlag).mockReturnValue(true)
      mockStore({ auctionDetails: { ...auctionDetails, requiredCurrencyRaised: '1' }, currentBlockNumber: 25 })
      mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: undefined, loading })
      mocked(useAuctionDisplayDataSources).mockReturnValue({
        currentBlock: { status: 'success', blockNumber: 25n },
        currencyRaised: { status: 'success', currencyRaised: '1' },
        pools: { status: 'loading' },
        refetchCurrentBlock: vi.fn(),
        refetchCheckpoint: vi.fn(),
      })

      const { result } = renderHook(() => useAuctionDisplayState())

      expect(useAuctionDisplayDataSources).toHaveBeenCalledWith({
        chainId: 1,
        tokenAddress: undefined,
        auctionAddress: '0xauction',
        startBlock: '10',
        endBlock: '20',
        enabled: true,
        currentBlock: { status: 'success', blockNumber: 25n },
      })
      expect(result.current).toMatchObject({
        phase: AuctionDisplayPhase.Ended,
        result: AuctionDisplayResult.Successful,
        poolAvailability,
      })
    },
  )

  it('lets the legacy launched banner take over when a redeemable underlying read fails', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStore({
      auctionDetails: {
        ...auctionDetails,
        chainId: UniverseChainId.Mainnet,
        tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
        requiredCurrencyRaised: '1',
      },
      currentBlockNumber: 25,
    })
    mocked(useAuctionTradingToken).mockReturnValue({ tradingTokenAddress: undefined, loading: false })
    mocked(useAuctionDisplayDataSources).mockReturnValue({
      currentBlock: { status: 'success', blockNumber: 25n },
      currencyRaised: { status: 'success', currencyRaised: '1' },
      pools: { status: 'loading' },
      refetchCurrentBlock: vi.fn(),
      refetchCheckpoint: vi.fn(),
    })

    const { result } = renderHook(() => useAuctionDisplayState())

    expect(result.current?.poolAvailability).toBe(PoolAvailability.NoPool)
    expect(shouldShowNowTradingCard({ state: result.current, tradingRestrictedUntilTge: false })).toBe(false)
    // No trade surface renders, so the timeline must promise claiming rather than trading.
    expect(shouldShowClaimOnlyTimeline(result.current)).toBe(true)
    expect(
      shouldShowTokenLaunchedBanner({
        isAuctionEnded: true,
        isTokenProvenanceEnabled: true,
        isGraduated: true,
        displayState: result.current,
        tradingRestrictedUntilTge: false,
      }),
    ).toBe(true)
  })
})
