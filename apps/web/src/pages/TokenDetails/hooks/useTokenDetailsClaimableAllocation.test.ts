import type { PlainMessage } from '@bufbuild/protobuf'
import { type RenderHookResult, renderHook } from '@testing-library/react'
import { type Auction, GetBidsByWalletRequest } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { type EVMUniverseChainId, UniverseChainId } from '@universe/chains'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TDPStoreState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTokenDetailsClaimableAllocation } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimableAllocation'
import type { TokenDetailsClaimSession } from '~/pages/TokenDetails/hooks/useTokenDetailsClaimSessions'
import { ClaimableAllocationState } from '~/pages/TokenDetails/utils/claimableAllocation'
import { mocked } from '~/test-utils/mocked'

const mockUseQuery = vi.fn()
const mockInvalidateQueries = vi.fn()
const mockUseAuctionDisplayDataSources = vi.fn()
const mockRefetchCurrentBlock = vi.fn()
const mockRefetchCheckpoint = vi.fn()

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal()),
  useQuery: (options: unknown) => mockUseQuery(options),
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: (params: unknown) => mockUseAuctionDisplayDataSources(params),
}))

const WALLET = '0xAbCdEF0000000000000000000000000000000001'
const AUCTION = {
  address: '0xAaAa000000000000000000000000000000000001',
  chainId: UniverseChainId.Mainnet,
  tokenAddress: '0xbbbb000000000000000000000000000000000001',
  startBlock: '100',
  endBlock: '200',
  claimBlock: '250',
  requiredCurrencyRaised: '1000',
  isQuickLaunch: false,
} as PlainMessage<Auction>

const ENDED_GRADUATED = {
  currentBlock: { status: 'success', blockNumber: 300n },
  currencyRaised: { status: 'success', currencyRaised: '1000' },
  pools: { status: 'success', poolCount: 1 },
  refetchCurrentBlock: mockRefetchCurrentBlock,
  refetchCheckpoint: mockRefetchCheckpoint,
}

let session: TokenDetailsClaimSession

/** The page store only feeds retry's GetAuction key; eligibility comes from the session argument. */
function mockSession({
  auction = AUCTION,
  chainId = UniverseChainId.Mainnet,
  walletAddress = WALLET,
}: {
  auction?: PlainMessage<Auction>
  chainId?: EVMUniverseChainId
  walletAddress?: string
} = {}): void {
  session = {
    sessionKey: `${chainId}:${auction.address.toLowerCase()}:${walletAddress.toLowerCase()}`,
    chainId,
    auction,
    walletAddress,
  }
  const state = { currencyChainId: chainId, address: AUCTION.tokenAddress } as TDPStoreState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPStoreState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

function renderAllocation(): RenderHookResult<ReturnType<typeof useTokenDetailsClaimableAllocation>, unknown> {
  return renderHook(() => useTokenDetailsClaimableAllocation({ session }))
}

function lastQueryOptions(): {
  queryKey: unknown[]
  enabled: boolean
  staleTime: number
  refetchInterval: number | false
} {
  return mockUseQuery.mock.calls.at(-1)?.[0]
}

describe('useTokenDetailsClaimableAllocation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseQuery.mockReturnValue({ data: undefined, error: null, isSuccess: false, isFetchedAfterMount: false })
    mockUseAuctionDisplayDataSources.mockReturnValue(ENDED_GRADUATED)
    mockSession()
  })

  it.each([
    { status: 'loading' },
    { status: 'error' },
    { status: 'success', blockNumber: 50n },
    { status: 'success', blockNumber: 150n },
  ])('does not reserve a claim card before the ended phase is confirmed: case %#', (currentBlock) => {
    mockUseAuctionDisplayDataSources.mockReturnValue({ ...ENDED_GRADUATED, currentBlock })

    const { result } = renderAllocation()

    expect(result.current.shouldReserveClaimSpace).toBe(false)
  })

  it('reserves a claim card while an ended auction waits for its checkpoint', () => {
    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...ENDED_GRADUATED,
      currencyRaised: { status: 'loading' },
    })

    const { result } = renderAllocation()

    expect(result.current.allocation.status).toBe(ClaimableAllocationState.Loading)
    expect(result.current.shouldReserveClaimSpace).toBe(true)
  })

  it('stops reserving the card once fresh bids confirm no allocation', () => {
    const { result, rerender } = renderAllocation()
    expect(result.current.shouldReserveClaimSpace).toBe(true)

    mockUseQuery.mockReturnValue({ data: { bids: [] }, error: null, isSuccess: true, isFetchedAfterMount: true })
    rerender()

    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotEligible)
    expect(result.current.shouldReserveClaimSpace).toBe(false)
  })

  it("requests the wallet's bids for the selected auction with the same query the ADP uses", () => {
    renderAllocation()
    const options = lastQueryOptions()

    expect(options.enabled).toBe(true)
    expect(options.queryKey).toHaveLength(3)
    expect(options.queryKey[0]).toBe(ReactQueryCacheKey.AuctionApi)
    expect(options.queryKey[1]).toBe('getBidsByWallet')
    expect(options.queryKey[2]).toBeInstanceOf(GetBidsByWalletRequest)
    expect(options.queryKey[2]).toMatchObject({
      walletId: WALLET.toLowerCase(),
      auctionAddress: AUCTION.address.toLowerCase(),
      chainId: UniverseChainId.Mainnet,
    })
  })

  it('maps the loaded bids to a claimable amount and refreshes the auction cache on retry', () => {
    mockUseQuery.mockReturnValue({
      data: {
        bids: [
          { bidId: '1', amount: '1000', status: 'submitted' },
          { bidId: '2', amount: '500', status: 'claimed' },
        ],
      },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: true,
    })

    const { result } = renderAllocation()

    expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 1000n })
    result.current.retry()
    expect(mockRefetchCurrentBlock).toHaveBeenCalledOnce()
    expect(mockRefetchCheckpoint).toHaveBeenCalledOnce()
    expect(mockInvalidateQueries).toHaveBeenCalledWith({
      queryKey: [
        ReactQueryCacheKey.AuctionApi,
        'getAuction',
        expect.objectContaining({ chainId: AUCTION.chainId, address: AUCTION.tokenAddress }),
      ],
      exact: true,
    })
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: lastQueryOptions().queryKey, exact: true })
  })

  it('surfaces a failed request as unavailable rather than zero', () => {
    const error = new Error('boom')
    mockUseQuery.mockReturnValue({ data: undefined, error })

    const { result } = renderAllocation()

    expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Unavailable, error })
  })

  it('offers a retry instead of an endless skeleton when the bids fetch is paused offline', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      error: null,
      isSuccess: false,
      isFetchedAfterMount: false,
      fetchStatus: 'paused',
    })

    const { result } = renderAllocation()

    expect(result.current.allocation.status).toBe(ClaimableAllocationState.Unavailable)
  })

  it('keeps showing post-mount bids when the connection drops afterwards', () => {
    mockUseQuery.mockReturnValue({
      data: { bids: [] },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: true,
      fetchStatus: 'paused',
    })

    const { result } = renderAllocation()

    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotEligible)
  })

  it('waits for claim opening and a fresh response before replacing a cached zero', () => {
    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...ENDED_GRADUATED,
      currentBlock: { status: 'success', blockNumber: 220n },
    })
    mockUseQuery.mockReturnValue({
      data: { bids: [{ bidId: '1', amount: '0', status: 'submitted' }] },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: false,
    })
    const { result, rerender } = renderAllocation()
    expect(lastQueryOptions().enabled).toBe(false)
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotOpen)
    expect(result.current.shouldReserveClaimSpace).toBe(false)

    mockUseAuctionDisplayDataSources.mockReturnValue(ENDED_GRADUATED)
    rerender()
    expect(lastQueryOptions().enabled).toBe(true)
    expect(lastQueryOptions().staleTime).toBe(0)
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.Loading)
    expect(result.current.shouldReserveClaimSpace).toBe(true)

    mockUseQuery.mockReturnValue({
      data: { bids: [{ bidId: '1', amount: '750', status: 'exited' }] },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: true,
    })
    rerender()
    expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Claimable, amountRaw: 750n })
    expect(result.current.shouldReserveClaimSpace).toBe(false)
  })

  it('polls within the ADP indexing window, then leaves late reads fresh without recurring requests', () => {
    const { rerender } = renderAllocation()
    expect(lastQueryOptions().refetchInterval).toBeGreaterThan(0)
    expect(mockUseAuctionDisplayDataSources).toHaveBeenLastCalledWith(
      expect.objectContaining({ tokenAddress: undefined, watchUntilBlock: 400n }),
    )

    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...ENDED_GRADUATED,
      currentBlock: { status: 'success', blockNumber: 400n },
    })
    rerender()
    expect(lastQueryOptions().refetchInterval).toBe(false)
    expect(lastQueryOptions().enabled).toBe(true)
    expect(lastQueryOptions().staleTime).toBe(0)
  })

  it('keeps watching when claiming opens after the indexing buffer', () => {
    mockSession({ auction: { ...AUCTION, claimBlock: '500' } })
    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...ENDED_GRADUATED,
      currentBlock: { status: 'success', blockNumber: 450n },
    })
    const { result, rerender } = renderAllocation()
    expect(lastQueryOptions().enabled).toBe(false)
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotOpen)
    expect(mockUseAuctionDisplayDataSources).toHaveBeenLastCalledWith(
      expect.objectContaining({ watchUntilBlock: 500n }),
    )

    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...ENDED_GRADUATED,
      currentBlock: { status: 'success', blockNumber: 500n },
    })
    rerender()
    expect(lastQueryOptions().enabled).toBe(true)
    expect(lastQueryOptions().refetchInterval).toBe(false)
    expect(lastQueryOptions().staleTime).toBe(0)
  })

  it('uses distinct keys for wallet, auction, and chain changes', () => {
    const { rerender } = renderAllocation()
    const firstKey = lastQueryOptions().queryKey
    const nextWallet = '0xcccc000000000000000000000000000000000001'
    mockSession({ walletAddress: nextWallet })
    rerender()
    const walletKey = lastQueryOptions().queryKey
    expect(walletKey).not.toEqual(firstKey)
    expect(walletKey[2]).toMatchObject({ walletId: nextWallet })

    const nextAuction = { ...AUCTION, address: '0xdddd000000000000000000000000000000000001' }
    mockSession({ auction: nextAuction })
    rerender()
    expect(lastQueryOptions().queryKey).not.toEqual(walletKey)
    expect(lastQueryOptions().queryKey[2]).toMatchObject({ auctionAddress: nextAuction.address })

    mockSession({
      auction: { ...nextAuction, chainId: UniverseChainId.ArbitrumOne },
      chainId: UniverseChainId.ArbitrumOne,
    })
    rerender()
    expect(lastQueryOptions().queryKey[2]).toMatchObject({ chainId: UniverseChainId.ArbitrumOne })
  })

  it.each(['', ' ', '-1', 'invalid'])(
    'requests bids for invalid claimBlock %s so only bidders see the failure',
    (claimBlock) => {
      mockSession({ auction: { ...AUCTION, claimBlock } })
      const { result, rerender } = renderAllocation()
      expect(lastQueryOptions().enabled).toBe(true)
      expect(result.current.allocation.status).toBe(ClaimableAllocationState.Loading)
      expect(mockUseAuctionDisplayDataSources).toHaveBeenLastCalledWith(
        expect.objectContaining({ watchUntilBlock: 400n }),
      )
      expect(lastQueryOptions().refetchInterval).toBeGreaterThan(0)

      mockUseAuctionDisplayDataSources.mockReturnValue({
        ...ENDED_GRADUATED,
        currentBlock: { status: 'success', blockNumber: 400n },
      })
      rerender()
      expect(lastQueryOptions().refetchInterval).toBe(false)
    },
  )

  it('requests bids when the block read fails and hides the failure from a wallet without bids', () => {
    mockUseAuctionDisplayDataSources.mockReturnValue({ ...ENDED_GRADUATED, currentBlock: { status: 'error' } })
    mockUseQuery.mockReturnValue({ data: { bids: [] }, error: null, isSuccess: true, isFetchedAfterMount: true })
    const { result } = renderAllocation()
    expect(lastQueryOptions()).toMatchObject({ enabled: true, refetchInterval: false })
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotEligible)
  })

  it('rejects retained amounts after a failed refresh', () => {
    const error = new Error('refresh failed')
    mockUseQuery.mockReturnValue({
      data: { bids: [{ bidId: '1', amount: '750', status: 'exited' }] },
      error,
      isSuccess: false,
      isFetchedAfterMount: true,
    })
    const { result } = renderAllocation()
    expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Unavailable, error })
  })

  it('opens the failed refund query at auction end and waits for its fresh response', () => {
    const failedSources = {
      ...ENDED_GRADUATED,
      currencyRaised: { status: 'success', currencyRaised: '10' },
    }
    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...failedSources,
      currentBlock: { status: 'success', blockNumber: 199n },
    })
    mockUseQuery.mockReturnValue({
      data: { bids: [] },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: false,
    })
    const { result, rerender } = renderAllocation()
    expect(lastQueryOptions().enabled).toBe(false)
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.NotOpen)

    mockUseAuctionDisplayDataSources.mockReturnValue({
      ...failedSources,
      currentBlock: { status: 'success', blockNumber: 200n },
    })
    rerender()
    expect(lastQueryOptions().enabled).toBe(true)
    expect(lastQueryOptions().staleTime).toBe(0)
    expect(lastQueryOptions().refetchInterval).toBeGreaterThan(0)
    expect(result.current.allocation.status).toBe(ClaimableAllocationState.Loading)

    mockUseQuery.mockReturnValue({
      data: {
        bids: [
          { bidId: '1', baseTokenInitial: '1000000000', status: 'submitted', amount: '0' },
          { bidId: '2', baseTokenInitial: '2000000000', status: 'submitted', amount: '0' },
        ],
      },
      error: null,
      isSuccess: true,
      isFetchedAfterMount: true,
    })
    rerender()
    expect(result.current.allocation).toEqual({ status: ClaimableAllocationState.Refundable, amountRaw: 3000000000n })
    result.current.retry()
    expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: lastQueryOptions().queryKey, exact: true })
  })

  it.each(['', '-1', 'invalid'])(
    'loads failed refunds and watches the indexing buffer without claimBlock %j',
    (claimBlock) => {
      mockSession({ auction: { ...AUCTION, claimBlock } })
      mockUseAuctionDisplayDataSources.mockReturnValue({
        ...ENDED_GRADUATED,
        currentBlock: { status: 'success', blockNumber: 220n },
        currencyRaised: { status: 'success', currencyRaised: '10' },
      })
      renderAllocation()
      expect(lastQueryOptions().enabled).toBe(true)
      expect(lastQueryOptions().refetchInterval).toBeGreaterThan(0)
      expect(mockUseAuctionDisplayDataSources).toHaveBeenLastCalledWith(
        expect.objectContaining({ watchUntilBlock: 400n }),
      )
    },
  )
})
