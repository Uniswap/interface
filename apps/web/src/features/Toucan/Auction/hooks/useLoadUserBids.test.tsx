import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import { Bid, type GetBidsByWalletRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import type { PropsWithChildren } from 'react'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { logger } from 'utilities/src/logger/logger'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useLoadUserBids } from '~/features/Toucan/Auction/hooks/useLoadUserBids'
import { AuctionStoreContext } from '~/features/Toucan/Auction/store/AuctionStoreContext'
import { createAuctionStore } from '~/features/Toucan/Auction/store/createAuctionStore'
import { AuctionOutcome, AuctionProgressState } from '~/features/Toucan/Auction/store/types'
import { mapApiBidsToUserBids } from '~/features/Toucan/Auction/utils/mapApiBidToUserBid'

const mocks = vi.hoisted(() => ({
  fetchBids: vi.fn(),
  transactions: new Map<string, { status: TransactionStatus }>(),
}))
vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries', () => ({
  auctionQueries: {
    getBidsByWallet: (options: {
      params?: GetBidsByWalletRequest
      enabled?: boolean
      refetchInterval?: number | false
    }) => ({
      ...options,
      queryKey: ['wallet-bids', options.params],
      queryFn: mocks.fetchBids,
      retry: false,
    }),
  },
}))
vi.mock('~/features/accounts/store/hooks', () => ({
  useActiveAddress: () => '0x1111111111111111111111111111111111111111',
}))
vi.mock('~/state/transactions/hooks', () => ({
  useTransaction: () => undefined,
  useTransactions: () => new Map(mocks.transactions),
}))
vi.mock('~/utils/averageBlockTimeMs', () => ({ getPollingIntervalMs: () => 25 }))
vi.mock('utilities/src/logger/logger', () => ({ logger: { error: vi.fn() } }))

const AUCTION = '0x2222222222222222222222222222222222222222'
const HASH = '0xclaim'
const exitedBid = new Bid({ bidId: '1', status: 'exited', amount: '125' })

function setup(onWithdrawalConfirmed?: () => void) {
  const store = createAuctionStore(AUCTION, UniverseChainId.Mainnet)
  store.setState({
    currentBlockNumber: 1000,
    auctionDetails: { ...store.getState().auctionDetails, endBlock: '200' } as NonNullable<
      ReturnType<typeof store.getState>['auctionDetails']
    >,
    progress: {
      ...store.getState().progress,
      state: AuctionProgressState.ENDED,
      outcome: AuctionOutcome.GRADUATED,
      isGraduated: true,
    },
    userBids: mapApiBidsToUserBids([exitedBid]),
    userBidsInitialized: true,
  })
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } })
  function Wrapper({ children }: PropsWithChildren): JSX.Element {
    return (
      <QueryClientProvider client={client}>
        <AuctionStoreContext.Provider value={store}>{children}</AuctionStoreContext.Provider>
      </QueryClientProvider>
    )
  }
  const hook = renderHook(
    () => useLoadUserBids({ auctionAddress: AUCTION, chainId: UniverseChainId.Mainnet, onWithdrawalConfirmed }),
    { wrapper: Wrapper },
  )
  return { ...hook, store, client }
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms)
  })
}

describe('useLoadUserBids receipt and indexing convergence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    mocks.transactions.clear()
    mocks.fetchBids.mockResolvedValue({ bids: [exitedBid] })
  })
  afterEach(() => vi.useRealTimers())

  it('refreshes once on receipt and polls beyond the end buffer until the API marks the bid claimed', async () => {
    const onWithdrawalConfirmed = vi.fn()
    const { store, rerender, unmount, client } = setup(onWithdrawalConfirmed)
    await advance(1)
    expect(mocks.fetchBids).toHaveBeenCalledTimes(1)
    await advance(100)
    expect(mocks.fetchBids).toHaveBeenCalledTimes(1)

    act(() => {
      store.getState().actions.addPendingWithdrawalBid('1', HASH)
      store.getState().actions.addAwaitingConfirmationBid('1')
    })
    await advance(25)
    expect(mocks.fetchBids.mock.calls.length).toBeGreaterThan(1)

    const callsBeforeReceipt = mocks.fetchBids.mock.calls.length
    mocks.transactions.set(HASH, { status: TransactionStatus.Success })
    rerender()
    await advance(1)
    // The hook refreshes its own query on receipt; the callback is a notification, not a replacement.
    expect(mocks.fetchBids).toHaveBeenCalledTimes(callsBeforeReceipt + 1)
    expect(onWithdrawalConfirmed).toHaveBeenCalledTimes(1)
    expect(store.getState().pendingWithdrawalBidIds.size).toBe(0)
    expect(store.getState().awaitingConfirmationBidIds.has('1')).toBe(true)
    const callsAtReceipt = mocks.fetchBids.mock.calls.length
    await advance(25)
    expect(mocks.fetchBids.mock.calls.length).toBeGreaterThan(callsAtReceipt)

    mocks.fetchBids.mockResolvedValue({ bids: [new Bid({ bidId: '1', status: 'claimed', amount: '125' })] })
    await advance(26)
    expect(store.getState().awaitingConfirmationBidIds.size).toBe(0)
    const callsAtConvergence = mocks.fetchBids.mock.calls.length
    await advance(100)
    expect(mocks.fetchBids).toHaveBeenCalledTimes(callsAtConvergence)
    expect(onWithdrawalConfirmed).toHaveBeenCalledTimes(1)
    unmount()
    client.clear()
  })

  it('refetches bids on receipt without a caller notification', async () => {
    const { store, rerender, unmount, client } = setup()
    await advance(1)
    act(() => {
      store.getState().actions.addPendingWithdrawalBid('1', HASH)
      store.getState().actions.addAwaitingConfirmationBid('1')
    })
    mocks.transactions.set(HASH, { status: TransactionStatus.Success })
    rerender()
    await advance(1)
    expect(mocks.fetchBids).toHaveBeenCalledTimes(2)
    expect(store.getState().awaitingConfirmationBidIds.has('1')).toBe(true)
    unmount()
    client.clear()
  })

  it('does not put a wallet-bearing request error into diagnostics', async () => {
    const requestError = new Error('walletId=0x1111111111111111111111111111111111111111 amount=125')
    mocks.fetchBids.mockRejectedValue(requestError)
    const { unmount, client } = setup()
    await advance(1)
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to load auction wallet bids' }),
      {
        tags: { file: 'useLoadUserBids.ts', function: 'useLoadUserBids' },
        extra: { chainId: UniverseChainId.Mainnet, auctionAddress: AUCTION },
      },
    )
    const logged = vi.mocked(logger.error).mock.calls[0]?.[0] as Error
    expect(logged).not.toBe(requestError)
    expect(logged.cause).toEqual({ name: 'Error', message: 'walletId=[address] amount=125' })
    unmount()
    client.clear()
  })
})
