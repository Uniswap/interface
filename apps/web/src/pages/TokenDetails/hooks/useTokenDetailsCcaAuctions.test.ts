import type { PlainMessage } from '@bufbuild/protobuf'
import { renderHook } from '@testing-library/react'
import { type Auction, AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { describe, expect, it, vi } from 'vitest'
import type { TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { useTokenDetailsCcaAuctions } from '~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions'
import { mocked } from '~/test-utils/mocked'

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))

const CUSTOM = {
  address: '0xAaAa000000000000000000000000000000000001',
  chainId: UniverseChainId.Sepolia,
  auctionType: AuctionType.CUSTOM,
} as PlainMessage<Auction>
const CROWD = { ...CUSTOM, address: '0xCcCc000000000000000000000000000000000001', auctionType: AuctionType.CROWD }
const UNCLASSIFIED = {
  ...CUSTOM,
  address: '0xEeEe000000000000000000000000000000000001',
  auctionType: AuctionType.UNSPECIFIED,
}
const OTHER_CHAIN = {
  ...CROWD,
  address: '0xDdDd000000000000000000000000000000000001',
  chainId: UniverseChainId.Mainnet,
}

function mockStore(auctionSource: TokenDetailsAuctionSource): void {
  const state = { currencyChainId: UniverseChainId.Sepolia, auctionSource } as TDPStoreState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPStoreState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

describe('useTokenDetailsCcaAuctions', () => {
  it('returns nothing while the auction source is unresolved', () => {
    mockStore({ status: TokenDetailsSourceState.Loading })

    expect(renderHook(() => useTokenDetailsCcaAuctions()).result.current).toEqual([])
  })

  it('keeps custom and crowd auctions on the page chain once each, in backend order', () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: CUSTOM,
      auctions: [CUSTOM, UNCLASSIFIED, CROWD, OTHER_CHAIN, { ...CUSTOM, address: CUSTOM.address.toLowerCase() }],
    })

    expect(renderHook(() => useTokenDetailsCcaAuctions()).result.current).toEqual([CUSTOM, CROWD])
  })
})
