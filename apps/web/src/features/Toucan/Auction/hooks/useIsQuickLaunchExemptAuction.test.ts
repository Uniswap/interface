import { renderHook } from '@testing-library/react'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useIsQuickLaunchExemptAuction } from '~/features/Toucan/Auction/hooks/useIsQuickLaunchExemptAuction'
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

const ONE_BILLION_RAW = `1${'0'.repeat(27)}`
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

/**
 * Matches the quick-launch fingerprint (see quickLaunchAuction.test.ts): native-currency raise,
 * 1B (1e27 raw) token total supply, and a mainnet block window of 300 blocks x 12s = 1h.
 */
function makeAuctionDetails(overrides: Partial<AuctionDetails> = {}): AuctionDetails {
  return {
    chainId: UniverseChainId.Mainnet,
    currency: ZERO_ADDRESS,
    tokenTotalSupply: ONE_BILLION_RAW,
    totalSupply: ONE_BILLION_RAW,
    startBlock: '1000',
    endBlock: '1300',
    ...overrides,
  } as unknown as AuctionDetails
}

function mockStoreAuctionDetails(auctionDetails: AuctionDetails | null): void {
  mocked(useAuctionStore).mockImplementation((selector) =>
    selector({ auctionDetails } as unknown as Omit<AuctionStoreState, 'actions'>),
  )
}

describe('useIsQuickLaunchExemptAuction', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns false when the feature flag is off, even for a matching quick-launch auction', () => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mockStoreAuctionDetails(makeAuctionDetails())

    const { result } = renderHook(() => useIsQuickLaunchExemptAuction())

    expect(result.current).toBe(false)
    expect(useFeatureFlag).toHaveBeenCalledWith(FeatureFlags.QuickLaunch)
  })

  it('returns false when the flag is on but auction details are null', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStoreAuctionDetails(null)

    const { result } = renderHook(() => useIsQuickLaunchExemptAuction())

    expect(result.current).toBe(false)
  })

  it('returns false when the flag is on but the auction does not match the quick-launch fingerprint', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    // Non-native raise breaks the fingerprint even with matching supply and window.
    mockStoreAuctionDetails(makeAuctionDetails({ currency: USDC_ADDRESS }))

    const { result } = renderHook(() => useIsQuickLaunchExemptAuction())

    expect(result.current).toBe(false)
  })

  it('returns false when the flag is on but the block window matches no duration preset', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    // 600 blocks x 12s = 2h on mainnet — between the 1h and 4h presets.
    mockStoreAuctionDetails(makeAuctionDetails({ endBlock: '1600' }))

    const { result } = renderHook(() => useIsQuickLaunchExemptAuction())

    expect(result.current).toBe(false)
  })

  it('returns true when the flag is on and the auction matches the quick-launch fingerprint', () => {
    mocked(useFeatureFlag).mockReturnValue(true)
    mockStoreAuctionDetails(makeAuctionDetails())

    const { result } = renderHook(() => useIsQuickLaunchExemptAuction())

    expect(result.current).toBe(true)
  })
})
