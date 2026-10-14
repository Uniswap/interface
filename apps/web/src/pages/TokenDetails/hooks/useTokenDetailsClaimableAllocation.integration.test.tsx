import type { PlainMessage } from '@bufbuild/protobuf'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import {
  type Auction,
  AuctionType,
  GetBidsByWalletRequest,
  GetBidsByWalletResponse,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { auctionQueries } from 'uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries'
import { useTokenDetailsClaimableAllocation } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimableAllocation'
import type { TokenDetailsClaimSession } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimSessions'
import { ClaimableAllocationState } from '~/pages/TokenDetails/utils/claimableAllocation'
import { getPollingIntervalMs } from '~/utils/averageBlockTimeMs'

const mockGetBidsByWallet = vi.fn()
let mockCurrentBlock = 220n
const walletAddress = '0x1111111111111111111111111111111111111111'
const auction = {
  address: '0x2222222222222222222222222222222222222222',
  chainId: UniverseChainId.Mainnet,
  startBlock: '100',
  endBlock: '200',
  claimBlock: '250',
  requiredCurrencyRaised: '1000',
  auctionType: AuctionType.CUSTOM,
} as PlainMessage<Auction>
const session: TokenDetailsClaimSession = {
  sessionKey: `${UniverseChainId.Mainnet}:${auction.address.toLowerCase()}:${walletAddress}`,
  chainId: UniverseChainId.Mainnet,
  auction,
  walletAddress,
}

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient', () => ({
  AuctionServiceClient: { getBidsByWallet: (params: unknown) => mockGetBidsByWallet(params) },
}))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: unknown) => unknown) =>
    selector({ currencyChainId: UniverseChainId.Mainnet, address: '0x3333333333333333333333333333333333333333' }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: () => ({
    currentBlock: { status: 'success', blockNumber: mockCurrentBlock },
    currencyRaised: { status: 'success', currencyRaised: '1000' },
    pools: { status: 'loading' },
    refetchCurrentBlock: vi.fn(),
    refetchCheckpoint: vi.fn(),
  }),
}))

function response(amount: string, status: string): GetBidsByWalletResponse {
  return new GetBidsByWalletResponse({ bids: [{ bidId: '1', walletId: walletAddress, amount, status }] })
}

afterEach(() => {
  vi.useRealTimers()
})

it('refreshes pre-claim zero through indexing, shares confirmation refresh, and stops recurring reads at the buffer', async () => {
  vi.useFakeTimers()
  mockCurrentBlock = 220n
  mockGetBidsByWallet.mockResolvedValue(response('0', 'submitted'))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const request = new GetBidsByWalletRequest({
    walletId: walletAddress,
    auctionAddress: auction.address,
    chainId: auction.chainId,
  })
  const bidsKey = auctionQueries.getBidsByWallet({ params: request }).queryKey
  client.setQueryData(
    bidsKey,
    new GetBidsByWalletResponse({ bids: [{ bidId: '1', amount: '5', status: 'submitted' }] }),
  )
  const wrapper = ({ children }: PropsWithChildren): JSX.Element => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  const { result, rerender, unmount } = renderHook(() => useTokenDetailsClaimableAllocation({ session }), { wrapper })
  expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotOpen)
  expect(mockGetBidsByWallet).not.toHaveBeenCalled()

  mockCurrentBlock = 250n
  rerender()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1)
  })
  expect(mockGetBidsByWallet).toHaveBeenCalledOnce()
  expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotEligible)

  mockGetBidsByWallet.mockResolvedValue(response('750', 'exited'))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(getPollingIntervalMs(UniverseChainId.Mainnet) + 1)
  })
  expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 750n })

  mockGetBidsByWallet.mockResolvedValue(response('750', 'claimed'))
  await act(async () => {
    result.current.retry()
    await vi.advanceTimersByTimeAsync(1)
  })
  expect(result.current.allocation.status).toBe(ClaimableAllocationState.Claimed)
  expect(client.getQueryData(bidsKey)).toMatchObject({ bids: [{ bidId: '1', status: 'claimed' }] })

  mockCurrentBlock = 400n
  rerender()
  const readsAtBufferEnd = mockGetBidsByWallet.mock.calls.length
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2 * getPollingIntervalMs(UniverseChainId.Mainnet))
  })
  expect(mockGetBidsByWallet).toHaveBeenCalledTimes(readsAtBufferEnd)
  unmount()
  client.clear()
})
