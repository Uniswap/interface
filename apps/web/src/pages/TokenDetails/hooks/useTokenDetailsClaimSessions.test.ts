import type { PlainMessage } from '@bufbuild/protobuf'
import { renderHook } from '@testing-library/react'
import { type Auction, AuctionType } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { useTokenDetailsClaimSessions } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimSessions'
import { mocked } from '~/test-utils/mocked'

const mockUseActiveAddress = vi.fn<() => string | undefined>()

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
vi.mock('~/features/accounts/store/hooks', () => ({ useActiveAddress: () => mockUseActiveAddress() }))

const WALLET = '0xAbCdEF0000000000000000000000000000000001'
const CUSTOM_A = {
  address: '0xAaAa000000000000000000000000000000000001',
  chainId: UniverseChainId.Sepolia,
  auctionType: AuctionType.CUSTOM,
} as PlainMessage<Auction>
const CUSTOM_B = { ...CUSTOM_A, address: '0xBbBb000000000000000000000000000000000001' }
const CROWD = { ...CUSTOM_A, address: '0xCcCc000000000000000000000000000000000001', auctionType: AuctionType.CROWD }
const OTHER_CHAIN = {
  ...CUSTOM_A,
  address: '0xDdDd000000000000000000000000000000000001',
  chainId: UniverseChainId.Mainnet,
}

function mockStore(auctionSource: TokenDetailsAuctionSource): void {
  const state = { currencyChainId: UniverseChainId.Sepolia, auctionSource } as TDPStoreState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPStoreState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

describe('useTokenDetailsClaimSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseActiveAddress.mockReturnValue(WALLET)
  })

  it('returns nothing without a connected EVM wallet', () => {
    mockUseActiveAddress.mockReturnValue(undefined)
    mockStore({ status: TokenDetailsSourceState.Found, auction: CUSTOM_A, auctions: [CUSTOM_A] })

    expect(renderHook(() => useTokenDetailsClaimSessions()).result.current).toEqual([])
  })

  it('returns nothing while the auction source is unresolved', () => {
    mockStore({ status: TokenDetailsSourceState.Loading })

    expect(renderHook(() => useTokenDetailsClaimSessions()).result.current).toEqual([])
  })

  it('creates one lowercase-keyed session per custom auction on the page chain, in auction order', () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: CUSTOM_A,
      auctions: [CUSTOM_A, CROWD, OTHER_CHAIN, CUSTOM_B],
    })

    const sessions = renderHook(() => useTokenDetailsClaimSessions()).result.current

    expect(sessions.map((session) => session.auction.address)).toEqual([CUSTOM_A.address, CUSTOM_B.address])
    expect(sessions[0]).toEqual({
      sessionKey: `${UniverseChainId.Sepolia}:${CUSTOM_A.address.toLowerCase()}:${WALLET.toLowerCase()}`,
      chainId: UniverseChainId.Sepolia,
      auction: CUSTOM_A,
      walletAddress: WALLET,
    })
  })

  it('keeps the same array while the inputs are unchanged', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction: CUSTOM_A, auctions: [CUSTOM_A] })
    const { result, rerender } = renderHook(() => useTokenDetailsClaimSessions())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })

  it('keeps the first occurrence of each auction address regardless of case', () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: CUSTOM_A,
      auctions: [CUSTOM_A, CUSTOM_B, { ...CUSTOM_A, address: CUSTOM_A.address.toLowerCase() }, CUSTOM_B],
    })

    const sessions = renderHook(() => useTokenDetailsClaimSessions()).result.current

    expect(sessions.map((session) => session.auction)).toEqual([CUSTOM_A, CUSTOM_B])
    expect(new Set(sessions.map((session) => session.sessionKey)).size).toBe(sessions.length)
  })
})
