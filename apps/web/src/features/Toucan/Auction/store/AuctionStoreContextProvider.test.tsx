import { act, render } from '@testing-library/react'
import { useContext } from 'react'
import { MemoryRouter, NavigateFunction, Route, Routes, useNavigate } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoadBidDistributionData } from '~/features/Toucan/Auction/hooks/useLoadBidDistributionData'
import { useLoadTickDetails } from '~/features/Toucan/Auction/hooks/useLoadTickDetails'
import { useLoadUserBids } from '~/features/Toucan/Auction/hooks/useLoadUserBids'
import { useUpdateTokenColor } from '~/features/Toucan/Auction/hooks/useUpdateTokenColor'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import {
  AuctionStoreInstanceProvider,
  AuctionStoreProvider,
} from '~/features/Toucan/Auction/store/AuctionStoreContextProvider'
import type { AuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'

// The provider's inner component wires up data loading + polling — irrelevant to
// store lifecycle, so stub them all out.
vi.mock('~/features/Toucan/Auction/hooks/useLoadAuctionDetails', () => ({ useLoadAuctionDetails: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useLoadCheckpointData', () => ({ useLoadCheckpointData: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useLoadUserBids', () => ({ useLoadUserBids: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useLoadBidDistributionData', () => ({ useLoadBidDistributionData: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useLoadTickDetails', () => ({ useLoadTickDetails: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useComputeConcentrationBand', () => ({
  useComputeConcentrationBand: vi.fn(),
}))
vi.mock('~/features/Toucan/Auction/hooks/useUpdateTokenColor', () => ({ useUpdateTokenColor: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionBlockPolling', () => ({ useAuctionBlockPolling: vi.fn() }))

const AUCTION_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
const CANONICAL_A = '0x1111111111111111111111111111111111111111'
const AUCTION_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'

let capturedStore: AuctionStore | null = null
let navigate: NavigateFunction

function Probe() {
  capturedStore = useContext(AuctionStoreContext)
  navigate = useNavigate()
  return null
}

function renderAtAuction(address: string) {
  return render(
    <MemoryRouter initialEntries={[`/explore/auctions/ethereum/${address}`]}>
      <Routes>
        <Route
          path="/explore/auctions/:chainName/:auctionAddress"
          element={
            <AuctionStoreProvider>
              <Probe />
            </AuctionStoreProvider>
          }
        />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuctionStoreProvider', () => {
  beforeEach(() => vi.clearAllMocks())

  it('initializes the store from the URL params', () => {
    renderAtAuction(AUCTION_A)

    expect(capturedStore?.getState().auctionAddress).toBe(AUCTION_A)
  })

  it('recreates the store when the route changes to a different auction', () => {
    renderAtAuction(AUCTION_A)
    const storeA = capturedStore
    expect(storeA).not.toBeNull()

    // Simulate GetAuction canonicalizing A's address so we can prove the
    // retained resolved address does not leak into auction B's store
    act(() => {
      storeA?.getState().actions.setAuctionDetails({ address: CANONICAL_A } as AuctionDetails)
    })
    expect(storeA?.getState().auctionAddress).toBe(CANONICAL_A)

    act(() => {
      navigate(`/explore/auctions/ethereum/${AUCTION_B}`)
    })

    expect(capturedStore).not.toBe(storeA)
    expect(capturedStore?.getState().auctionAddress).toBe(AUCTION_B)
  })

  it('keeps the same store instance when re-navigating to the same auction', () => {
    renderAtAuction(AUCTION_A)
    const storeA = capturedStore

    act(() => {
      navigate(`/explore/auctions/ethereum/${AUCTION_A}`)
    })

    expect(capturedStore).toBe(storeA)
  })

  it('loads chart data on the ADP, but only transaction data in a standalone claim store', () => {
    const page = renderAtAuction(AUCTION_A)
    expect(useLoadBidDistributionData).toHaveBeenCalled()
    expect(useLoadTickDetails).toHaveBeenCalled()
    expect(useUpdateTokenColor).toHaveBeenCalled()
    page.unmount()
    vi.clearAllMocks()

    const onWithdrawalConfirmed = vi.fn()
    render(
      <AuctionStoreInstanceProvider auctionAddress={AUCTION_A} onWithdrawalConfirmed={onWithdrawalConfirmed}>
        <div />
      </AuctionStoreInstanceProvider>,
    )
    expect(useLoadUserBids).toHaveBeenCalledWith(
      expect.objectContaining({ auctionAddress: AUCTION_A, onWithdrawalConfirmed }),
    )
    expect(useLoadBidDistributionData).not.toHaveBeenCalled()
    expect(useLoadTickDetails).not.toHaveBeenCalled()
    expect(useUpdateTokenColor).not.toHaveBeenCalled()
  })
})
