import { renderHook } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsQuickLaunchAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction'
import type { AuctionDetails, AuctionStoreState } from '~/features/Toucan/Auction/store/types'
import { useAuctionStore } from '~/features/Toucan/Auction/store/useAuctionStore'
import { mocked } from '~/test-utils/mocked'

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useFeatureFlag: vi.fn(),
  }
})

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: vi.fn(),
}))

function makeAuctionDetails(isQuickLaunch = true): AuctionDetails {
  return { isQuickLaunch } as unknown as AuctionDetails
}

function mockStoreAuctionDetails(auctionDetails: AuctionDetails | null): void {
  mocked(useAuctionStore).mockImplementation((selector) =>
    selector({ auctionDetails } as unknown as Omit<AuctionStoreState, 'actions'>),
  )
}

describe('useIsQuickLaunchAuction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when the feature flag is off, even for a backend-classified quick launch', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mockStoreAuctionDetails(makeAuctionDetails())

    const { result } = renderHook(() => useIsQuickLaunchAuction())

    expect(result.current).toBe(false)
    expect(useFeatureFlag).toHaveBeenCalledWith(FeatureFlags.QuickLaunch)
  })

  it('returns false when the flag is on but auction details are null', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStoreAuctionDetails(null)

    const { result } = renderHook(() => useIsQuickLaunchAuction())

    expect(result.current).toBe(false)
  })

  it('returns false when the flag is on but the backend marker is unset', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStoreAuctionDetails(makeAuctionDetails(false))

    const { result } = renderHook(() => useIsQuickLaunchAuction())

    expect(result.current).toBe(false)
  })

  it('returns true when the flag is on and the backend classifies the auction as a quick launch', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStoreAuctionDetails(makeAuctionDetails())

    const { result } = renderHook(() => useIsQuickLaunchAuction())

    expect(result.current).toBe(true)
  })
})
