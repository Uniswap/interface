import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { createTDPStore, type TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'

describe('createTDPStore', () => {
  it('updates the auction source without splitting its status from its data', () => {
    const store = createTDPStore({
      pageQueryLoading: true,
      auctionSource: { status: TokenDetailsSourceState.Loading },
    } as unknown as TDPState)
    const auction = { address: '0x1111111111111111111111111111111111111111' }

    store.getState().actions.setAuctionSource({
      status: TokenDetailsSourceState.Found,
      auction: auction as PlainMessage<Auction>,
      auctions: [auction as PlainMessage<Auction>],
    })

    expect(store.getState()).toMatchObject({
      auctionSource: { status: TokenDetailsSourceState.Found, auction, auctions: [auction] },
    })
  })
})
