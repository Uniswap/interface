import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBlock } from 'wagmi'
import { BiddingClosedStrip } from '~/features/Toucan/Auction/Banners/BiddingClosedStrip'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { render, screen } from '~/test-utils/render'

vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({
  useAuctionDisplayState: vi.fn(),
}))
let mockBlockTimestamp: bigint | undefined
vi.mock('wagmi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('wagmi')>()),
  useBlock: vi.fn(() => ({ data: mockBlockTimestamp === undefined ? undefined : { timestamp: mockBlockTimestamp } })),
}))

let mockEstimatedEndTime: { seconds: bigint; nanos: number } | undefined
let mockEndBlock: string | undefined
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: unknown) => unknown) =>
    selector({
      auctionDetails: {
        chainId: UniverseChainId.Mainnet,
        endBlock: mockEndBlock,
        estimatedEndTime: mockEstimatedEndTime,
      },
    }),
}))

const ENDED_AT_SECONDS = 1783693283n

const ENDED: AuctionDisplayState = {
  phase: AuctionDisplayPhase.Ended,
  result: AuctionDisplayResult.Unknown,
  poolAvailability: PoolAvailability.NoPool,
  shouldShowSwap: false,
}

describe('BiddingClosedStrip', () => {
  beforeEach(() => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(ENDED)
    vi.mocked(useBlock).mockClear()
    mockEstimatedEndTime = undefined
    mockBlockTimestamp = undefined
    mockEndBlock = '22900000'
  })

  it('uses the status-strip padding and separates it from the stats above', () => {
    render(<BiddingClosedStrip />)

    const strip = screen.getByTestId(TestID.ToucanBiddingClosedStrip)
    expect(getOwnStyleProp(strip, 'px')).toBe('$spacing16')
    expect(getOwnStyleProp(strip, 'py')).toBe('$spacing12')
    expect(getOwnStyleProp(strip, 'mt')).toBe('$spacing2')
    expect(getOwnStyleProp(strip, 'mb')).toBe('$spacing12')
  })

  it('shows the indexed end time without reading the end block', () => {
    mockEstimatedEndTime = { seconds: ENDED_AT_SECONDS, nanos: 0 }

    render(<BiddingClosedStrip />)

    expect(screen.getByText('Bidding now closed')).toBeDefined()
    expect(screen.getByText(/^Auction ended Jul 10, 2026/)).toBeDefined()
    expect(useBlock).toHaveBeenLastCalledWith(expect.objectContaining({ query: { enabled: false } }))
  })

  it('reads only the historical end block when no end time is indexed', () => {
    mockBlockTimestamp = ENDED_AT_SECONDS

    render(<BiddingClosedStrip />)

    expect(screen.getByText(/^Auction ended Jul 10, 2026/)).toBeDefined()
    expect(useBlock).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      blockNumber: 22900000n,
      query: { enabled: true },
    })
  })

  it('treats a zero indexed end time as missing and reads the end block', () => {
    mockEstimatedEndTime = { seconds: 0n, nanos: 0 }
    mockBlockTimestamp = ENDED_AT_SECONDS

    render(<BiddingClosedStrip />)

    expect(screen.getByText(/^Auction ended Jul 10, 2026/)).toBeDefined()
    expect(useBlock).toHaveBeenLastCalledWith(expect.objectContaining({ query: { enabled: true } }))
  })

  it.each([undefined, '', 'invalid', '-1'])('does not read an invalid end block: %s', (endBlock) => {
    mockEndBlock = endBlock

    render(<BiddingClosedStrip />)

    expect(screen.getByText('Bidding now closed')).toBeDefined()
    expect(screen.queryByText(/^Auction ended/)).toBeNull()
    expect(useBlock).toHaveBeenLastCalledWith(expect.objectContaining({ query: { enabled: false } }))
  })

  it('does not render or read a block while bidding is live', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue({ ...ENDED, phase: AuctionDisplayPhase.Live })

    render(<BiddingClosedStrip />)

    expect(screen.queryByTestId(TestID.ToucanBiddingClosedStrip)).toBeNull()
    expect(useBlock).toHaveBeenLastCalledWith(expect.objectContaining({ query: { enabled: false } }))
  })

  it('does not render or read a block while provenance is disabled', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(undefined)

    render(<BiddingClosedStrip />)

    expect(screen.queryByTestId(TestID.ToucanBiddingClosedStrip)).toBeNull()
    expect(useBlock).toHaveBeenLastCalledWith(expect.objectContaining({ query: { enabled: false } }))
  })
})
