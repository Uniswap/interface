import type { PlainMessage } from '@bufbuild/protobuf'
import { type Auction, AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { logger } from 'utilities/src/logger/logger'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CurrencyRaisedState } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { TokenDetailsAuctionListModal } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { fireEvent, render, screen, within } from '~/test-utils/render'

const mockNavigate = vi.fn()
vi.mock('~/hooks/useNavigateToAuctionDetails', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/hooks/useNavigateToAuctionDetails')>()),
  useNavigateToAuctionDetails: () => mockNavigate,
}))
vi.mock('utilities/src/time/useSharedMachineTimeMs', () => ({ useSharedMachineTimeMs: () => Date.now() }))
vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({ useCurrencyInfo: () => undefined }))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: unknown) => unknown) =>
    selector({
      currencyChainId: UniverseChainId.Mainnet,
      address: '0x3333333333333333333333333333333333333333',
      currency: { symbol: 'FOO' },
    }),
}))

// Post-end checkpoint per auction address; the modal must read the outcome from here, not from committed bids.
const RAISED_BY_ADDRESS: Record<string, CurrencyRaisedState> = {}
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: ({ auctionAddress }: { auctionAddress: string | undefined }) => ({
    currentBlock: { status: 'success', blockNumber: 1000n },
    currencyRaised: RAISED_BY_ADDRESS[auctionAddress ?? ''] ?? { status: 'idle' },
    // The row skips the pool query; settled results must not depend on pool availability.
    pools: { status: 'loading' },
    refetchCurrentBlock: vi.fn(),
    refetchCheckpoint: vi.fn(),
  }),
}))

const NOW_SECONDS = Math.floor(Date.now() / 1000)
const ONE_HOUR = 60 * 60

function auction({
  auctionId,
  start,
  end,
  startBlock,
  endBlock,
  raised,
}: {
  auctionId: string
  start: number
  end: number
  startBlock: string
  endBlock: string
  raised?: CurrencyRaisedState
}): PlainMessage<Auction> {
  const address = `0x${auctionId.padStart(40, '0')}`
  if (raised) {
    RAISED_BY_ADDRESS[address] = raised
  }
  return {
    auctionId,
    address,
    chainId: UniverseChainId.Mainnet,
    tokenAddress: '0x3333333333333333333333333333333333333333',
    tokenSymbol: 'FOO',
    tokenName: 'Foo Token',
    estimatedStartTime: { seconds: BigInt(NOW_SECONDS + start), nanos: 0 },
    estimatedEndTime: { seconds: BigInt(NOW_SECONDS + end), nanos: 0 },
    startBlock,
    endBlock,
    totalBidVolume: '100',
    totalBidVolumeUsd: '1500',
    requiredCurrencyRaised: '50',
    currencyTokenDecimals: 0,
    currencyPriceUsd: '1',
  } as PlainMessage<Auction>
}

const LIVE = auction({ auctionId: 'a1', start: -ONE_HOUR, end: 24 * ONE_HOUR, startBlock: '900', endBlock: '1100' })
const UPCOMING = auction({ auctionId: 'a2', start: ONE_HOUR, end: 2 * ONE_HOUR, startBlock: '1100', endBlock: '1200' })
const ENDED_OK = auction({
  auctionId: 'a3',
  start: -3 * ONE_HOUR,
  end: -ONE_HOUR,
  startBlock: '700',
  endBlock: '800',
  raised: { status: 'success', currencyRaised: '100' },
})
const ENDED_PENDING = auction({
  auctionId: 'a4',
  start: -12 * ONE_HOUR,
  end: -10 * ONE_HOUR,
  startBlock: '650',
  endBlock: '700',
  raised: { status: 'loading' },
})
// Committed bids clear the threshold, yet the settled checkpoint says the raise fell short.
const ENDED_FAILED = auction({
  auctionId: 'a5',
  start: -30 * ONE_HOUR,
  end: -28 * ONE_HOUR,
  startBlock: '500',
  endBlock: '600',
  raised: { status: 'success', currencyRaised: '10' },
})

describe('TokenDetailsAuctionListModal', () => {
  const ALL = [ENDED_FAILED, UPCOMING, ENDED_PENDING, ENDED_OK, LIVE]

  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('lists every CCA auction live-first with its status column', () => {
    render(<TokenDetailsAuctionListModal auctions={ALL} isOpen onClose={vi.fn()} />)

    expect(screen.getByText('FOO auctions')).toBeInTheDocument()
    const rows = screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)
    expect(rows).toHaveLength(5)
    expect(rows[0]).toHaveTextContent('Committed')
    expect(rows[0]).not.toHaveTextContent('Starting soon')
    expect(rows[1]).toHaveTextContent('Starting soon')
    expect(rows[1]).not.toHaveTextContent('Committed')
    expect(rows[2]).toHaveTextContent('Launched')
    expect(rows[2]).toHaveTextContent('Raised')
    expect(rows[3]).toHaveTextContent('Ended')
    expect(rows[3]).toHaveTextContent('Committed')
    expect(rows[3]).not.toHaveTextContent('Launched')
    expect(rows[4]).toHaveTextContent('Failed to launch')
    expect(rows[4]).toHaveTextContent('Committed')
  })

  it('spaces the live progress above its timer and mutes the failed amount caption', () => {
    render(<TokenDetailsAuctionListModal auctions={ALL} isOpen onClose={vi.fn()} />)

    const rows = screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)
    const liveCountdown = within(rows[0]!).getByText(/^\d+[dhms]/)
    expect(getOwnStyleProp(liveCountdown.parentElement!, 'gap')).toBe('$spacing8')
    const failedCaption = within(rows[4]!).getByText('Committed')
    expect(getOwnStyleProp(failedCaption, 'color')).toBe('$neutral3')
  })

  it('shows the checkpoint raise, not committed bids, for a launched auction', () => {
    render(<TokenDetailsAuctionListModal auctions={ALL} isOpen onClose={vi.fn()} />)

    const launched = screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)[2]
    expect(launched).toHaveTextContent('$100')
    expect(launched).not.toHaveTextContent('$1.5K')
    const failed = screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)[4]
    expect(failed).toHaveTextContent('$1.5K')
    expect(failed).not.toHaveTextContent('Raised')
  })

  it.each([LIVE, ENDED_PENDING])('shows unknown committed volume as missing for %o', (entry) => {
    render(<TokenDetailsAuctionListModal auctions={[{ ...entry, totalBidVolumeUsd: '' }]} isOpen onClose={vi.fn()} />)

    const row = screen.getByTestId(TestID.TokenDetailsAuctionListRow)
    expect(row).toHaveTextContent('—')
    expect(row).toHaveTextContent('Committed')
    expect(row).not.toHaveTextContent('$0')
  })

  it('navigates to the pressed auction and closes', () => {
    const onClose = vi.fn()
    render(<TokenDetailsAuctionListModal auctions={ALL} isOpen onClose={onClose} />)

    fireEvent.click(screen.getAllByTestId(TestID.TokenDetailsAuctionListRow)[1]!)

    expect(mockNavigate).toHaveBeenCalledWith({ auctionAddress: UPCOMING.address, chainId: UniverseChainId.Mainnet })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('opens a quick launch on its pools.xyz token page instead of an in-app auction page', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const onClose = vi.fn()
    const quickLaunch = { ...LIVE, auctionType: AuctionType.CROWD, chainId: UniverseChainId.Robinhood }
    render(<TokenDetailsAuctionListModal auctions={[quickLaunch]} isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionListRow))

    expect(open).toHaveBeenCalledWith(
      `https://pools.xyz/t/robinhood/${quickLaunch.tokenAddress}`,
      '_blank',
      'noopener,noreferrer',
    )
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
    open.mockRestore()
  })

  it('reports a crowd launch with no addressable page instead of opening the in-app auction', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null)
    const addPopup = vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => {})
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const onClose = vi.fn()
    // pools.xyz does not serve Mainnet, so this crowd launch has no page anywhere.
    const strandedCrowdLaunch = { ...LIVE, auctionType: AuctionType.CROWD }
    render(<TokenDetailsAuctionListModal auctions={[strandedCrowdLaunch]} isOpen onClose={onClose} />)

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionListRow))

    expect(addPopup).toHaveBeenCalledWith(
      expect.objectContaining({ type: PopupType.Error }),
      'auction-navigation-error',
      expect.any(Number),
    )
    expect(open).not.toHaveBeenCalled()
    expect(mockNavigate).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledOnce()
    open.mockRestore()
    addPopup.mockRestore()
    warn.mockRestore()
  })
})
