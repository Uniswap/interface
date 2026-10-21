import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActivityTimeline } from '~/features/Toucan/Auction/ActivityTimeline/ActivityTimeline'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { isTradingRestrictedUntilTge } from '~/features/Toucan/Config/config'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: unknown) => unknown) =>
    selector({
      auctionDetails: {
        address: '0xauction',
        tokenAddress: '0x1111111111111111111111111111111111111111',
        chainId: UniverseChainId.Mainnet,
        creationBlock: '100',
        createdAt: '2025-01-01T00:00:00Z',
        endBlock: '500',
        claimBlock: '600',
        parsedAuctionSteps: [{ mps: 1, startBlock: '200' }],
      },
      currentBlockNumber: 700,
    }),
  useIsAuctionFailed: () => false,
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({ useAuctionDisplayState: vi.fn() }))
vi.mock('~/features/Toucan/Config/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Config/config')>()),
  isTradingRestrictedUntilTge: vi.fn(),
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionKycStatus', () => ({
  useAuctionKycStatus: () => ({ auctionHasPresale: false, allowlistEndBlock: undefined }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionTokenColor', () => ({
  useAuctionTokenColor: () => ({ effectiveTokenColor: '#ff007a' }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({
  useBidTokenInfo: () => ({ bidTokenInfo: undefined }),
}))

function graduated(poolAvailability: PoolAvailability): AuctionDisplayState {
  return {
    phase: AuctionDisplayPhase.Ended,
    result: AuctionDisplayResult.Successful,
    poolAvailability,
    // Mirrors resolveAuctionDisplayState: only a confirmed missing pool takes the swap away.
    shouldShowSwap: poolAvailability !== PoolAvailability.NoPool,
  }
}

describe('ActivityTimeline', () => {
  beforeEach(() => {
    vi.mocked(isTradingRestrictedUntilTge).mockReturnValue(false)
  })

  it('only promises claiming once a graduated auction is confirmed to have no pool', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(graduated(PoolAvailability.NoPool))

    render(<ActivityTimeline />)

    expect(screen.getByText('Token available to claim')).toBeInTheDocument()
    expect(screen.queryByText('Token available to trade')).toBeNull()
  })

  // shouldShowSwap still offers trading in both, so claim-only copy would contradict the same page.
  it.each([PoolAvailability.Loading, PoolAvailability.Error])(
    'keeps the trading copy while pool availability is %s',
    (poolAvailability) => {
      vi.mocked(useAuctionDisplayState).mockReturnValue(graduated(poolAvailability))

      render(<ActivityTimeline />)

      expect(screen.getByText('Token available to trade')).toBeInTheDocument()
      expect(screen.queryByText('Token available to claim')).toBeNull()
    },
  )

  it('preserves the existing trading copy when provenance is disabled', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)

    render(<ActivityTimeline />)

    expect(screen.getByText('Token available to trade')).toBeInTheDocument()
  })

  it('says the token is available to trade once a pool exists', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(graduated(PoolAvailability.HasPool))

    render(<ActivityTimeline />)

    expect(screen.getByText('Token available to trade')).toBeInTheDocument()
  })

  it.each([undefined, ...Object.values(PoolAvailability)])(
    'prioritizes TGE restriction copy with pool availability %s',
    (poolAvailability) => {
      vi.mocked(useAuctionDisplayState).mockReturnValue(
        poolAvailability === undefined ? undefined : graduated(poolAvailability),
      )
      vi.mocked(isTradingRestrictedUntilTge).mockReturnValue(true)

      render(<ActivityTimeline />)
      fireEvent.click(screen.getByText('Token available to claim'))

      expect(screen.queryByText('Token available to trade')).toBeNull()
      expect(screen.getByText(/Trading is restricted until the Token Generation Event/)).toBeInTheDocument()
      expect(screen.queryByText(/Trading opens once a pool is live/)).toBeNull()
    },
  )
})
