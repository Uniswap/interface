import { renderHook } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuctionDisplayDataSources } from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import type { AuctionDetails, AuctionStoreState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { AuctionDisplayPhase, PoolAvailability } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
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
})
