import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useNowTradingCardVisibility } from '~/features/Toucan/Auction/hooks/useNowTradingCardVisibility'
import {
  type AuctionDisplayState,
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'

let mockDisplayState: AuctionDisplayState | undefined
let mockAuctionDetails: Record<string, unknown> | null
let mockIsTradingRestrictedUntilTge = false

vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({
  useAuctionDisplayState: () => mockDisplayState,
}))
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: { auctionDetails: Record<string, unknown> | null }) => unknown) =>
    selector({ auctionDetails: mockAuctionDetails }),
}))
vi.mock('~/features/Toucan/Config/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Config/config')>()),
  isTradingRestrictedUntilTge: () => mockIsTradingRestrictedUntilTge,
}))

describe('useNowTradingCardVisibility', () => {
  beforeEach(() => {
    mockDisplayState = {
      phase: AuctionDisplayPhase.Ended,
      result: AuctionDisplayResult.Successful,
      poolAvailability: PoolAvailability.HasPool,
      shouldShowSwap: true,
    }
    mockAuctionDetails = { chainId: 1, tokenAddress: '0x0000000000000000000000000000000000000001' }
    mockIsTradingRestrictedUntilTge = false
  })

  it('shows once a successful auction has ended with a pool', () => {
    expect(renderHook(() => useNowTradingCardVisibility()).result.current.isVisible).toBe(true)
  })

  it('hides without auction details', () => {
    mockAuctionDetails = null
    expect(renderHook(() => useNowTradingCardVisibility()).result.current.isVisible).toBe(false)
  })

  it('hides while trading is restricted until the TGE', () => {
    mockIsTradingRestrictedUntilTge = true
    expect(renderHook(() => useNowTradingCardVisibility()).result.current.isVisible).toBe(false)
  })

  it('hides while provenance is off', () => {
    mockDisplayState = undefined
    expect(renderHook(() => useNowTradingCardVisibility()).result.current.isVisible).toBe(false)
  })

  it('holds the slot while the checkpoint and the pool lookup are still in flight', () => {
    mockDisplayState = {
      phase: AuctionDisplayPhase.Ended,
      result: AuctionDisplayResult.Unknown,
      poolAvailability: PoolAvailability.Loading,
      shouldShowSwap: true,
      resultPending: true,
    }
    const { isVisible, mayBecomeVisible } = renderHook(() => useNowTradingCardVisibility()).result.current
    expect(isVisible).toBe(false)
    expect(mayBecomeVisible).toBe(true)
  })

  it('releases the slot once the checkpoint fails rather than pends', () => {
    mockDisplayState = {
      phase: AuctionDisplayPhase.Ended,
      result: AuctionDisplayResult.Unknown,
      poolAvailability: PoolAvailability.Loading,
      shouldShowSwap: true,
    }
    expect(renderHook(() => useNowTradingCardVisibility()).result.current.mayBecomeVisible).toBe(false)
  })
})
