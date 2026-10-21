import type { AuctionActivityEntry } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BidActivities } from '~/features/Toucan/Auction/BidActivities/BidActivities'
import { useAuctionStatsData } from '~/features/Toucan/Auction/hooks/useAuctionStatsData'
import { useBidTokenInfo } from '~/features/Toucan/Auction/hooks/useBidTokenInfo'
import { useLoadBidActivities } from '~/features/Toucan/Auction/hooks/useLoadBidActivities'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

const { TABLE_PROBE } = vi.hoisted(() => ({ TABLE_PROBE: 'bid-activities-table-probe' }))

// Leaf-only swap: the real Table renders its rows through a virtualizer and a scroll container that
// jsdom gives no layout, so its infinite scroll can never fire here. The probe stands in for that
// scroll — it reports whether the table was handed a `loadMore` at all and lets a click invoke it.
// Everything deciding WHETHER it gets one (the pending-bid bookkeeping, the hover state) stays real.
vi.mock('~/components/Table', () => ({
  Table: ({ data, loadMore }: { data: unknown[]; loadMore?: (params: { onComplete?: () => void }) => void }) => (
    <div data-testid={TABLE_PROBE} data-rows={String(data.length)} data-can-load-more={String(Boolean(loadMore))}>
      <button type="button" data-testid={`${TABLE_PROBE}-load-more`} onClick={() => loadMore?.({})} />
    </div>
  ),
}))

vi.mock('~/features/Toucan/Auction/hooks/useLoadBidActivities', () => ({ useLoadBidActivities: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useBidTokenInfo', () => ({ useBidTokenInfo: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionStatsData', () => ({ useAuctionStatsData: vi.fn() }))

const loadMore = vi.fn()

const AUCTION_ADDRESS = '0x4644fb88b741eF8EA32aC6FeE6f2534aEEc0D02f'
const BID_TOKEN_ADDRESS = '0xE2C24A2394415EA928653f27c74684C95057B13B'

/** Newest first, as the feed serves them — bidId N down to N - count + 1. */
function makeActivities({ newestBidId, count }: { newestBidId: number; count: number }): AuctionActivityEntry[] {
  return Array.from({ length: count }, (_, index) => {
    const id = newestBidId - index
    return {
      bidId: String(id),
      wallet: `0x${String(id).padStart(40, '0')}`,
      price: '1750942391565146',
      baseTokenInitial: '1889953906',
      createdAt: new Date(Date.UTC(2026, 8, 8, 12, 0, id)).toISOString(),
      status: 'submitted',
      txHash: `0x${String(id).padStart(64, '0')}`,
    } as unknown as AuctionActivityEntry
  })
}

/** The element carrying the component's hover handlers — the Flex wrapping the table. */
function hoverTarget(): HTMLElement {
  return screen.getByTestId(TABLE_PROBE).parentElement as HTMLElement
}

/**
 * The table's own view of paging: whether it holds a `loadMore`, and whether invoking it reaches the
 * feed. Both matter — a withdrawn prop is what stalls the reader, and it is also what
 * useTableLoadMore reads as a pagination-mode switch (dropping `loadingMore` mid-fetch).
 */
function paging(): { offered: boolean; reaches: boolean } {
  const offered = screen.getByTestId(TABLE_PROBE).getAttribute('data-can-load-more') === 'true'
  loadMore.mockClear()
  fireEvent.click(screen.getByTestId(`${TABLE_PROBE}-load-more`))
  return { offered, reaches: loadMore.mock.calls.length > 0 }
}

function renderActivities({ activities }: { activities: AuctionActivityEntry[] }) {
  mocked(useLoadBidActivities).mockReturnValue({
    activities,
    loading: false,
    loadMore,
    error: null,
  } as unknown as ReturnType<typeof useLoadBidActivities>)

  const store = createAuctionStore(AUCTION_ADDRESS, UniverseChainId.Robinhood)
  store.getState().actions.setAuctionDetails({
    address: AUCTION_ADDRESS,
    chainId: UniverseChainId.Robinhood,
    currency: BID_TOKEN_ADDRESS,
    token: { currency: { isNative: false, name: 'Note Systems', symbol: 'NOTE', decimals: 18 } },
  } as unknown as AuctionDetails)

  function Wrapper({ children }: PropsWithChildren) {
    return <AuctionStoreContext.Provider value={store}>{children}</AuctionStoreContext.Provider>
  }

  const { rerender } = render(
    <Wrapper>
      <BidActivities />
    </Wrapper>,
  )

  return {
    /** A poll tick landing new bids on top of the loaded tape. */
    pollBids: (next: AuctionActivityEntry[]) => {
      mocked(useLoadBidActivities).mockReturnValue({
        activities: next,
        loading: false,
        loadMore,
        error: null,
      } as unknown as ReturnType<typeof useLoadBidActivities>)
      rerender(
        <Wrapper>
          <BidActivities />
        </Wrapper>,
      )
    },
  }
}

describe('BidActivities paging (LP-927)', () => {
  beforeEach(() => {
    loadMore.mockReset()
    mocked(useBidTokenInfo).mockReturnValue({
      bidTokenInfo: { decimals: 18, symbol: 'USDG', priceFiat: 1 },
      loading: false,
      error: null,
    } as unknown as ReturnType<typeof useBidTokenInfo>)
    mocked(useAuctionStatsData).mockReturnValue({ totalBidCount: 140 } as unknown as ReturnType<
      typeof useAuctionStatsData
    >)
  })

  it('offers paging on the loaded tape', () => {
    renderActivities({ activities: makeActivities({ newestBidId: 139, count: 10 }) })

    expect(paging()).toEqual({ offered: true, reaches: true })
  })

  // Vacuity anchor for the two cases below: 11 bids are loaded but only 10 render, which is only
  // true while the pending count is non-zero. Without it they would pass just as well against a
  // fixture whose poll registered no pending bid at all.
  it('holds a polled bid behind the pill while the pointer rests on the table', () => {
    const { pollBids } = renderActivities({ activities: makeActivities({ newestBidId: 139, count: 10 }) })

    fireEvent.mouseEnter(hoverTarget())
    pollBids(makeActivities({ newestBidId: 140, count: 11 }))

    expect(screen.getByTestId(TABLE_PROBE)).toHaveAttribute('data-rows', '10')
  })

  it('keeps paging through a polled bid', () => {
    const { pollBids } = renderActivities({ activities: makeActivities({ newestBidId: 139, count: 10 }) })

    pollBids(makeActivities({ newestBidId: 140, count: 11 }))

    expect(paging()).toEqual({ offered: true, reaches: true })
  })

  it('keeps paging while the pointer rests on the table', () => {
    const { pollBids } = renderActivities({ activities: makeActivities({ newestBidId: 139, count: 10 }) })

    // Hovering is not an edge case: the pointer is over the table whenever the reader scrolls it,
    // and hovering suppresses the 200ms auto-acknowledge — so the pending count never clears on its
    // own and anything gated on it stays gated until the reader clicks the "new bids" pill.
    fireEvent.mouseEnter(hoverTarget())
    pollBids(makeActivities({ newestBidId: 140, count: 11 }))

    expect(paging()).toEqual({ offered: true, reaches: true })
  })
})
