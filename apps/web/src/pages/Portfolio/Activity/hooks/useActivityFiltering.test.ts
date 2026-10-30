import { renderHook } from '@testing-library/react'
import { TransactionTypeFilter } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import type { TradingApi } from '@universe/api'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import {
  NFTTradeType,
  TransactionDetails,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'
import { useActivityFiltering } from '~/pages/Portfolio/Activity/hooks/useActivityFiltering'

vi.mock('uniswap/src/features/activity/hooks/useActivityData')
vi.mock('utilities/src/react/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({ sentinelRef: { current: null } }),
}))

beforeEach(() => {
  vi.mocked(useActivityData).mockClear()
})

const mockCreatePoolTx = {
  id: 'pool-tx-1',
  hash: '0xabc',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.CreatePool },
} as TransactionDetails

const mockSwapTx = {
  id: 'swap-tx-1',
  hash: '0xdef',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.Swap },
} as TransactionDetails

const mockSendTx = {
  id: 'send-tx-1',
  hash: '0x111',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.Send },
} as TransactionDetails

const mockDepositTx = {
  id: 'deposit-tx-1',
  hash: '0x222',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.Deposit },
} as TransactionDetails

const mockReceiveTx = {
  id: 'receive-tx-1',
  hash: '0x333',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.Receive },
} as TransactionDetails

const mockNftBuyTx = {
  id: 'nft-buy-tx-1',
  hash: '0x444',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.NFTTrade, tradeType: NFTTradeType.BUY },
} as TransactionDetails

const mockNftSellTx = {
  id: 'nft-sell-tx-1',
  hash: '0x555',
  addedTime: Date.now(),
  typeInfo: { type: TransactionType.NFTTrade, tradeType: NFTTradeType.SELL },
} as TransactionDetails

const mockEarnDepositPlanTx = {
  id: 'earn-deposit-plan-tx-1',
  addedTime: Date.now(),
  typeInfo: {
    type: TransactionType.Plan,
    earnAction: 'deposit' as TradingApi.EarnAction,
  },
} as TransactionDetails

const mockEarnWithdrawPlanTx = {
  id: 'earn-withdraw-plan-tx-1',
  addedTime: Date.now(),
  typeInfo: {
    type: TransactionType.Plan,
    earnAction: 'withdraw' as TradingApi.EarnAction,
  },
} as TransactionDetails

function mockActivityData(txs: TransactionDetails[]) {
  ;(useActivityData as ReturnType<typeof vi.fn>).mockReturnValue({
    sectionData: txs,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isLoading: false,
    isFetching: false,
  })
}

describe('useActivityFiltering — local transaction filter bypass bug', () => {
  it('does NOT show CreatePool tx when Swaps filter is active (EVM-only wallet)', () => {
    // EVM-only wallet with Swaps filter active.
    // sectionData simulates a local CreatePool tx leaking past server-side filtering
    // (via useMergeLocalAndRemoteTransactions which reads all Redux txs without type filtering).
    mockActivityData([mockSwapTx, mockCreatePoolTx])

    const { result } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined, // EVM-only → server-side filtering is enabled
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Swaps,
        selectedTimePeriod: 'all',
      }),
    )

    const types = result.current.transactionData.map((tx) => tx.typeInfo.type)
    expect(types).toContain(TransactionType.Swap)
    expect(types).not.toContain(TransactionType.CreatePool)
  })

  it('shows all tx types when All filter is active', () => {
    mockActivityData([mockSwapTx, mockCreatePoolTx])

    const { result } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.All,
        selectedTimePeriod: 'all',
      }),
    )

    const types = result.current.transactionData.map((tx) => tx.typeInfo.type)
    expect(types).toContain(TransactionType.Swap)
    expect(types).toContain(TransactionType.CreatePool)
  })

  it('shows CreatePool tx when CreatePool filter is active', () => {
    mockActivityData([mockSwapTx, mockCreatePoolTx])

    const { result } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.CreatePool,
        selectedTimePeriod: 'all',
      }),
    )

    const types = result.current.transactionData.map((tx) => tx.typeInfo.type)
    expect(types).not.toContain(TransactionType.Swap)
    expect(types).toContain(TransactionType.CreatePool)
  })

  it('falls back to client-side filtering for sends/receives since NFT trades are SWAP server-side', () => {
    mockActivityData([])

    renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Sends,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: undefined,
      }),
    )

    renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Receives,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: undefined,
      }),
    )
  })

  it('classifies NFT purchases as receives and sales as sends', () => {
    mockActivityData([mockSwapTx, mockNftBuyTx, mockNftSellTx])

    const { result: receivesResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Receives,
        selectedTimePeriod: 'all',
      }),
    )

    expect(receivesResult.current.transactionData.map((tx) => tx.id)).toEqual([mockNftBuyTx.id])

    const { result: sendsResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Sends,
        selectedTimePeriod: 'all',
      }),
    )

    expect(sendsResult.current.transactionData.map((tx) => tx.id)).toEqual([mockNftSellTx.id])

    const { result: swapsResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Swaps,
        selectedTimePeriod: 'all',
      }),
    )

    expect(swapsResult.current.transactionData.map((tx) => tx.id)).toEqual([mockSwapTx.id])
  })

  it('falls back to client-side filtering for earn filters that need multiple server types', () => {
    mockActivityData([mockSendTx, mockDepositTx, mockReceiveTx])

    const { result } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Sends,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: undefined,
      }),
    )
    expect(result.current.transactionData.map((tx) => tx.typeInfo.type)).toEqual([
      TransactionType.Send,
      TransactionType.Deposit,
    ])
  })

  it('classifies Earn deposit and withdraw plans by their activity filter type', () => {
    mockActivityData([mockSwapTx, mockEarnDepositPlanTx, mockEarnWithdrawPlanTx])

    const { result: sendsResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Sends,
        selectedTimePeriod: 'all',
      }),
    )

    expect(sendsResult.current.transactionData.map((tx) => tx.id)).toEqual([mockEarnDepositPlanTx.id])

    const { result: withdrawalsResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Withdrawals,
        selectedTimePeriod: 'all',
      }),
    )

    expect(withdrawalsResult.current.transactionData.map((tx) => tx.id)).toEqual([mockEarnWithdrawPlanTx.id])

    const { result: swapsResult } = renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Swaps,
        selectedTimePeriod: 'all',
      }),
    )

    expect(swapsResult.current.transactionData.map((tx) => tx.id)).toEqual([mockSwapTx.id])
  })

  it('requests single server filters for filters that map to one server type', () => {
    mockActivityData([])

    renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Swaps,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: [TransactionTypeFilter.SWAP],
      }),
    )
  })

  it.each([
    { evmAddress: undefined, svmAddress: 'So1ana' },
    { evmAddress: '0x123', svmAddress: 'So1ana' },
  ])('requests server filters for wallets with a Solana address (evm: $evmAddress)', ({ evmAddress, svmAddress }) => {
    mockActivityData([])

    const { result } = renderHook(() =>
      useActivityFiltering({
        evmAddress,
        svmAddress,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Swaps,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: [TransactionTypeFilter.SWAP],
      }),
    )
    expect(result.current.isUsingServerFiltering).toBe(true)
  })
})
