import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDurationRemaining } from '~/features/Toucan/Auction/hooks/useDurationRemaining'
import { renderHook } from '~/test-utils/render'

const mockUseBlockNumber = vi.fn()
const mockUseBlock = vi.fn()
const mockNow = vi.fn()
const mockStoreState: { auctionDetails: { creationBlock?: string; createdAt?: string } | undefined } = {
  auctionDetails: undefined,
}

vi.mock('wagmi', async () => ({
  ...(await vi.importActual('wagmi')),
  useBlockNumber: () => mockUseBlockNumber(),
  useBlock: (params: any) => mockUseBlock(params),
}))

vi.mock('~/hooks/useMachineTime', () => ({
  useMachineTimeMs: () => mockNow(),
}))

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

// A creation-block anchor 900 blocks / 900s behind the live block → a real 1s/block rate, far
// below Mainnet's 12s chain constant. Mirrors the auction table's two-anchor calibration.
const ANCHOR_BLOCK = '100'
const ANCHOR_TIME_MS = 1_000_000_000 // 1,000,000s
const LIVE_BLOCK = 1000n
const LIVE_TIMESTAMP = 1_000_900n // anchor + 900 blocks at 1s/block
const NOW_MS = 1_000_900_000 // live-block wall-clock

function withAnchor(): void {
  mockStoreState.auctionDetails = { creationBlock: ANCHOR_BLOCK, createdAt: new Date(ANCHOR_TIME_MS).toISOString() }
}

describe('useDurationRemaining', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseBlockNumber.mockReturnValue({ data: LIVE_BLOCK })
    mockUseBlock.mockReturnValue({ data: { timestamp: LIVE_TIMESTAMP } })
    mockNow.mockReturnValue(NOW_MS)
    mockStoreState.auctionDetails = undefined
  })

  it('derives the countdown from the calibrated block rate when anchored on the creation block', () => {
    withAnchor()

    const { result } = renderHook(() => useDurationRemaining(UniverseChainId.Mainnet, 1010))

    // Calibrated target = anchor(1,000,000s) + (1010 - 100) * 1s = 1,000,910s → 10s from now.
    expect(result.current).toBe('10s')
  })

  it('falls back to the chain-constant rate when the auction has no creation-block anchor', () => {
    const { result } = renderHook(() => useDurationRemaining(UniverseChainId.Mainnet, 1010))

    // Uncalibrated target = live(1,000,900s) + (1010 - 1000) * 12s = 1,001,020s → 120s from now.
    expect(result.current).toBe('2m 0s')
  })

  it('returns undefined when no target block is provided', () => {
    withAnchor()

    const { result } = renderHook(() => useDurationRemaining(UniverseChainId.Mainnet, undefined))

    expect(result.current).toBeUndefined()
  })

  it('returns undefined once the calibrated target is in the past', () => {
    withAnchor()
    mockNow.mockReturnValue(1_000_911_000) // 1s past the calibrated 1,000,910s target

    const { result } = renderHook(() => useDurationRemaining(UniverseChainId.Mainnet, 1010))

    expect(result.current).toBeUndefined()
  })
})
