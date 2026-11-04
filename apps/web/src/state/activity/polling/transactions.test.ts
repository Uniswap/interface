import { TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { TradingApiClient } from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { usePollPendingTransactions } from '~/state/activity/polling/transactions'
import { ActivityUpdateTransactionType } from '~/state/activity/types'
import type { PendingTransactionDetails } from '~/state/transactions/types'
import { renderHookWithProviders } from '~/test-utils/renderHookWithProviders'

const CHAIN_ID = UniverseChainId.Mainnet
const ADDRESS = '0x0000000000000000000000000000000000000001'
const HASH = '0x30cba85e97dcd016b3b876a558266c4dfd2ad2b6f21ff92c4b2b2f75ffbcbf80'

const mockGetTransactionReceipt = vi.fn()
const mockPendingTransactions: PendingTransactionDetails[] = []

vi.mock('wagmi', () => ({
  usePublicClient: () => ({ getTransactionReceipt: mockGetTransactionReceipt }),
}))

vi.mock('~/connection/hooks/useAccount', () => ({
  useAccount: () => ({ address: ADDRESS, chainId: CHAIN_ID, isConnected: true }),
}))

vi.mock('~/connection/hooks/useCurrentBlockTimestamp', () => ({
  useCurrentBlockTimestamp: () => ({ blockTimestamp: undefined, blockTimestampUpdatedAt: Date.now() }),
}))

vi.mock('~/lib/hooks/useBlockNumber', () => ({
  useBlockNumber: () => 1000,
}))

vi.mock('~/state/transactions/hooks', () => ({
  useMultichainTransactions: () => mockPendingTransactions.map((tx) => [tx, CHAIN_ID]),
  useTransactionRemover: () => vi.fn(),
}))

vi.mock('uniswap/src/data/apiClients/tradingApi/TradingApiClient', () => ({
  TradingApiClient: { fetchSwaps: vi.fn() },
}))

vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const mockFetchSwaps = vi.mocked(TradingApiClient.fetchSwaps)

function makePendingTx(typeInfo: PendingTransactionDetails['typeInfo']): PendingTransactionDetails {
  return {
    id: HASH,
    hash: HASH,
    chainId: CHAIN_ID,
    from: ADDRESS,
    typeInfo,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: { from: ADDRESS, chainId: CHAIN_ID } },
  } as PendingTransactionDetails
}

const auctionLaunchTypeInfo = {
  type: TransactionType.AuctionLaunch,
  requestId: 'request-1',
} as PendingTransactionDetails['typeInfo']

function makeViemReceipt(status: 'success' | 'reverted') {
  return {
    status,
    blockHash: '0xblockhash',
    blockNumber: BigInt(1000),
    transactionIndex: 1,
    gasUsed: BigInt(21000),
    effectiveGasPrice: BigInt(1000000000),
  }
}

describe('usePollPendingTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPendingTransactions.length = 0
  })

  it('finalizes an AuctionLaunch tx from its on-chain receipt, without consulting the Trading API', async () => {
    // Regression test: the Trading API's /swaps endpoint doesn't track auction launches (it never quoted
    // them), so its not-found/failed response must not mark a successfully mined launch tx as Failed.
    mockPendingTransactions.push(makePendingTx(auctionLaunchTypeInfo))
    mockGetTransactionReceipt.mockResolvedValue(makeViemReceipt('success'))
    mockFetchSwaps.mockRejectedValue(new Error('404: swap not found'))

    const onActivityUpdate = vi.fn()
    renderHookWithProviders(() => usePollPendingTransactions(onActivityUpdate))

    await vi.waitFor(() => expect(onActivityUpdate).toHaveBeenCalledTimes(1))
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActivityUpdateTransactionType.BaseTransaction,
        chainId: CHAIN_ID,
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: HASH }),
      }),
    )
    expect(mockFetchSwaps).not.toHaveBeenCalled()
  })

  it('finalizes an AuctionLaunch tx as Failed when its on-chain receipt reverted', async () => {
    mockPendingTransactions.push(makePendingTx(auctionLaunchTypeInfo))
    mockGetTransactionReceipt.mockResolvedValue(makeViemReceipt('reverted'))

    const onActivityUpdate = vi.fn()
    renderHookWithProviders(() => usePollPendingTransactions(onActivityUpdate))

    await vi.waitFor(() => expect(onActivityUpdate).toHaveBeenCalledTimes(1))
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Failed }),
      }),
    )
    expect(mockFetchSwaps).not.toHaveBeenCalled()
  })

  it('finalizes an LP create-pool tx from its on-chain receipt, without consulting the Trading API', async () => {
    // Regression test (LP-755): /swaps never reports a terminal status for LP txs it didn't quote,
    // which left position creations pending forever and missing from the activity page.
    mockPendingTransactions.push(
      makePendingTx({
        type: TransactionType.CreatePool,
        currency0Id: `1-0x2260fac5e5542a773aa44fbcfedf7c193bc2c599`,
        currency1Id: `1-0xdac17f958d2ee523a2206206994597c13d831ec7`,
        currency0AmountRaw: '66',
        currency1AmountRaw: '349270',
      } as PendingTransactionDetails['typeInfo']),
    )
    mockGetTransactionReceipt.mockResolvedValue(makeViemReceipt('success'))
    mockFetchSwaps.mockRejectedValue(new Error('404: swap not found'))

    const onActivityUpdate = vi.fn()
    renderHookWithProviders(() => usePollPendingTransactions(onActivityUpdate))

    await vi.waitFor(() => expect(onActivityUpdate).toHaveBeenCalledTimes(1))
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: ActivityUpdateTransactionType.BaseTransaction,
        chainId: CHAIN_ID,
        update: expect.objectContaining({ status: TransactionStatus.Success, hash: HASH }),
      }),
    )
    expect(mockFetchSwaps).not.toHaveBeenCalled()
  })

  it('still finalizes swap txs from the Trading API swap status', async () => {
    mockPendingTransactions.push(makePendingTx({ type: TransactionType.Swap } as PendingTransactionDetails['typeInfo']))
    mockGetTransactionReceipt.mockResolvedValue(makeViemReceipt('success'))
    mockFetchSwaps.mockResolvedValue({
      requestId: 'request-1',
      swaps: [{ status: TradingApi.SwapStatus.SUCCESS, txHash: HASH }],
    })

    const onActivityUpdate = vi.fn()
    renderHookWithProviders(() => usePollPendingTransactions(onActivityUpdate))

    await vi.waitFor(() => expect(onActivityUpdate).toHaveBeenCalledTimes(1))
    expect(mockFetchSwaps).toHaveBeenCalledWith({ txHashes: [HASH], chainId: CHAIN_ID, swapper: ADDRESS })
    expect(onActivityUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ status: TransactionStatus.Success }),
      }),
    )
  })
})
