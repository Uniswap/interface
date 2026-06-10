import { renderHook } from '@testing-library/react'
import { TransactionTypeFilter } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/utils'
import { useActivityFiltering } from '~/pages/Portfolio/Activity/hooks/useActivityFiltering'

vi.mock('uniswap/src/features/activity/hooks/useActivityData')
vi.mock('utilities/src/react/useInfiniteScroll', () => ({
  useInfiniteScroll: () => ({ sentinelRef: { current: null } }),
}))

const mockUseFeatureFlag = vi.mocked(useFeatureFlag)

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

  it('requests legacy single server filters when earn is disabled', () => {
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
        filterTransactionTypes: [TransactionTypeFilter.SEND],
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
        filterTransactionTypes: [TransactionTypeFilter.RECEIVE],
      }),
    )

    renderHook(() =>
      useActivityFiltering({
        evmAddress: '0x123',
        svmAddress: undefined,
        chainId: undefined,
        selectedTransactionType: ActivityFilterType.Withdrawals,
        selectedTimePeriod: 'all',
      }),
    )

    expect(useActivityData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filterTransactionTypes: [TransactionTypeFilter.WITHDRAW],
      }),
    )
  })

  it('falls back to client-side filtering for earn filters that need multiple server types', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.Earn)
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

  it('still requests single server filters when earn is enabled', () => {
    mockUseFeatureFlag.mockImplementation((flag) => flag === FeatureFlags.Earn)
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
})
