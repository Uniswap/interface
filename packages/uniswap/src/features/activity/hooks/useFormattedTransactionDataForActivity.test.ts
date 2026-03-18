/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { NetworkStatus } from '@apollo/client'
import { TradingApi } from '@universe/api'
import dayjs from 'dayjs'
import { useFormattedTransactionDataForActivity } from 'uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TransactionStatus } from 'uniswap/src/features/transactions/types/transactionDetails'
import { transactionDetails, uniswapXOrderDetails } from 'uniswap/src/test/fixtures/wallet/transactions'
import { renderHook } from 'uniswap/src/test/test-utils'
import type { MockedFunction } from 'vitest'

// Mock dependencies
vi.mock('uniswap/src/features/dataApi/listTransactions/listTransactions')
vi.mock('uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions')
vi.mock('uniswap/src/features/activity/formatTransactionsByDate')
vi.mock('uniswap/src/features/language/localizedDayjs')
vi.mock('uniswap/src/features/transactions/selectors')
vi.mock('react-redux', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-redux')>()
  return {
    ...actual,
    useSelector: vi.fn(),
  }
})

import { useSelector } from 'react-redux'
import { formatTransactionsByDate } from 'uniswap/src/features/activity/formatTransactionsByDate'
import { useMergeLocalAndRemoteTransactions } from 'uniswap/src/features/activity/hooks/useMergeLocalAndRemoteTransactions'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { useLocalizedDayjs } from 'uniswap/src/features/language/localizedDayjs'
import { useCurrencyIdToVisibility } from 'uniswap/src/features/transactions/selectors'
import { TEST_WALLET } from 'uniswap/src/test/fixtures/wallet/addresses'

const mockUseSelector = useSelector as MockedFunction<typeof useSelector>
const mockUseCurrencyIdToVisibility = useCurrencyIdToVisibility as MockedFunction<typeof useCurrencyIdToVisibility>
const mockUseLocalizedDayjs = useLocalizedDayjs as MockedFunction<typeof useLocalizedDayjs>
const mockUseMergeLocalAndRemoteTransactions = useMergeLocalAndRemoteTransactions as MockedFunction<
  typeof useMergeLocalAndRemoteTransactions
>
const mockFormatTransactionsByDate = formatTransactionsByDate as MockedFunction<typeof formatTransactionsByDate>
const mockUseListTransactions = useListTransactions as MockedFunction<typeof useListTransactions>

describe('useFormattedTransactionDataForActivity', () => {
  const mockRefetch = vi.fn().mockResolvedValue(undefined)
  const mockFetchNextPage = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mocks
    mockUseSelector.mockReturnValue({})
    mockUseCurrencyIdToVisibility.mockReturnValue({})
    mockUseLocalizedDayjs.mockReturnValue(dayjs)
    mockUseMergeLocalAndRemoteTransactions.mockReturnValue([])
    mockFormatTransactionsByDate.mockReturnValue({
      pending: [],
      todayTransactionList: [],
      yesterdayTransactionList: [],
      priorByMonthTransactionList: {},
    })
    mockUseListTransactions.mockReturnValue({
      data: [],
      loading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
      networkStatus: NetworkStatus.ready,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    })
  })

  const createTestTransaction = (overrides = {}) =>
    transactionDetails({
      chainId: UniverseChainId.Mainnet,
      from: TEST_WALLET,
      status: TransactionStatus.Success,
      ...overrides,
    })

  const mockListTransactions = (overrides = {}) => {
    mockUseListTransactions.mockReturnValue({
      data: [],
      loading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
      networkStatus: NetworkStatus.ready,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
      ...overrides,
    })
  }

  const mockFormatByDate = (overrides = {}) => {
    mockFormatTransactionsByDate.mockReturnValue({
      pending: [],
      todayTransactionList: [],
      yesterdayTransactionList: [],
      priorByMonthTransactionList: {},
      ...overrides,
    })
  }

  const renderFormattedHook = (props = {}) =>
    renderHook(() =>
      useFormattedTransactionDataForActivity({
        evmAddress: TEST_WALLET,
        ownerAddresses: [TEST_WALLET],
        fiatOnRampParams: undefined,
        hideSpamTokens: false,
        ...props,
      }),
    )

  describe('loading states', () => {
    it('should show loading data when no data and loading', () => {
      mockListTransactions({ data: undefined, loading: true, networkStatus: NetworkStatus.loading })
      const { result } = renderFormattedHook()

      expect(result.current.isLoading).toBe(true)
      expect(result.current.hasData).toBe(false)
      expect(result.current.sectionData).toHaveLength(4) // LOADING_DATA has 4 items
    })

    it('should handle fetching next page state', () => {
      const tx = createTestTransaction()
      mockListTransactions({ data: [tx], hasNextPage: true, isFetchingNextPage: true })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([tx])

      const { result } = renderFormattedHook()

      expect(result.current.isFetchingNextPage).toBe(true)
      expect(result.current.hasNextPage).toBe(true)
    })
  })

  describe('error states', () => {
    it('should handle error from useListTransactions', () => {
      const mockError = new Error('API error')
      mockListTransactions({ data: undefined, error: mockError, networkStatus: NetworkStatus.error })

      const { result } = renderFormattedHook()

      expect(result.current.isError).toBe(mockError)
      expect(result.current.hasData).toBe(false)
    })

    it('should provide retry functionality', async () => {
      mockListTransactions({ data: undefined, error: new Error('Test error'), networkStatus: NetworkStatus.error })

      const { result } = renderFormattedHook()

      await result.current.onRetry()
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('limit order filtering', () => {
    it('should filter out limit orders', () => {
      const regularSwap = createTestTransaction({
        id: 'regular-swap',
        routing: TradingApi.Routing.CLASSIC,
      })
      const limitOrder = uniswapXOrderDetails({
        id: 'limit-order',
        routing: TradingApi.Routing.DUTCH_LIMIT,
        chainId: UniverseChainId.Mainnet,
        from: TEST_WALLET,
      })

      mockListTransactions({ data: [regularSwap, limitOrder] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([regularSwap, limitOrder])
      mockFormatByDate({ todayTransactionList: [regularSwap] })

      renderFormattedHook()

      // formatTransactionsByDate should be called with only the regular swap (limit order filtered)
      expect(formatTransactionsByDate).toHaveBeenCalledWith(expect.arrayContaining([regularSwap]), expect.anything())
    })
  })

  describe('chainId filtering', () => {
    it('should filter transactions by chainIds when provided', () => {
      const mainnetTx = createTestTransaction({ id: 'mainnet-tx' })
      const arbitrumTx = createTestTransaction({ id: 'arbitrum-tx', chainId: UniverseChainId.ArbitrumOne })

      mockListTransactions({ data: [mainnetTx, arbitrumTx] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([mainnetTx, arbitrumTx])
      mockFormatByDate({ todayTransactionList: [mainnetTx] })

      renderFormattedHook({ chainIds: [UniverseChainId.Mainnet] })

      expect(formatTransactionsByDate).toHaveBeenCalledWith([mainnetTx], expect.anything())
    })

    it('should not filter when chainIds is undefined', () => {
      const mainnetTx = createTestTransaction({ chainId: UniverseChainId.Mainnet })
      const arbitrumTx = createTestTransaction({ chainId: UniverseChainId.ArbitrumOne })

      mockListTransactions({ data: [mainnetTx, arbitrumTx] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([mainnetTx, arbitrumTx])

      renderFormattedHook()

      expect(formatTransactionsByDate).toHaveBeenCalledWith([mainnetTx, arbitrumTx], expect.anything())
    })
  })

  describe('section data structure', () => {
    it('should create sections with headers and transactions', () => {
      const pendingTx = createTestTransaction({ id: 'pending-tx', status: TransactionStatus.Pending })
      const todayTx = createTestTransaction({ id: 'today-tx' })

      mockListTransactions({ data: [pendingTx, todayTx] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([pendingTx, todayTx])
      mockFormatByDate({ pending: [pendingTx], todayTransactionList: [todayTx] })

      const { result } = renderFormattedHook()

      expect(result.current.sectionData).toHaveLength(3)
      expect(result.current.sectionData?.[0]).toEqual({ itemType: 'HEADER', title: 'Today' })
      expect(result.current.sectionData?.[1]).toEqual(pendingTx)
      expect(result.current.sectionData?.[2]).toEqual(todayTx)
    })

    it('should handle multiple date sections', () => {
      const todayTx = createTestTransaction({ id: 'today-tx' })
      const yesterdayTx = createTestTransaction({ id: 'yesterday-tx' })
      const oldTx = createTestTransaction({ id: 'old-tx' })

      mockListTransactions({ data: [todayTx, yesterdayTx, oldTx] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([todayTx, yesterdayTx, oldTx])
      mockFormatByDate({
        todayTransactionList: [todayTx],
        yesterdayTransactionList: [yesterdayTx],
        priorByMonthTransactionList: { 'October 2024': [oldTx] },
      })

      const { result } = renderFormattedHook()

      expect(result.current.sectionData).toHaveLength(6)
      expect(result.current.sectionData?.[0]).toEqual({ itemType: 'HEADER', title: 'Today' })
      expect(result.current.sectionData?.[2]).toEqual({ itemType: 'HEADER', title: 'Yesterday' })
      expect(result.current.sectionData?.[4]).toEqual({ itemType: 'HEADER', title: 'October 2024' })
    })
  })

  describe('pagination', () => {
    it('should handle hasNextPage correctly', () => {
      const tx = createTestTransaction()
      mockListTransactions({ data: [tx], hasNextPage: true })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([tx])

      const { result } = renderFormattedHook()

      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.fetchNextPage).toBe(mockFetchNextPage)
    })

    it('should return false for hasNextPage when max limit reached', () => {
      // Create 250 transactions (MAX_ACTIVITY_ITEMS for non-Android)
      const transactions = Array.from({ length: 250 }, (_, i) => createTestTransaction({ id: `tx-${i}` }))

      mockListTransactions({ data: transactions, hasNextPage: true })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue(transactions)

      const { result } = renderFormattedHook()

      // Should be false despite API returning hasNextPage=true because limit reached
      expect(result.current.hasNextPage).toBe(false)
    })
  })

  describe('combined filtering', () => {
    it('should filter both limit orders and chainIds', () => {
      const mainnetSwap = createTestTransaction({
        id: 'mainnet-swap',
        chainId: UniverseChainId.Mainnet,
        routing: TradingApi.Routing.CLASSIC,
      })
      const arbitrumSwap = createTestTransaction({
        id: 'arbitrum-swap',
        chainId: UniverseChainId.ArbitrumOne,
        routing: TradingApi.Routing.CLASSIC,
      })
      const limitOrder = uniswapXOrderDetails({
        id: 'limit',
        chainId: UniverseChainId.Mainnet,
        routing: TradingApi.Routing.DUTCH_LIMIT,
        from: TEST_WALLET,
      })

      mockListTransactions({ data: [mainnetSwap, arbitrumSwap, limitOrder] })
      mockUseMergeLocalAndRemoteTransactions.mockReturnValue([mainnetSwap, arbitrumSwap, limitOrder])
      mockFormatByDate({ todayTransactionList: [mainnetSwap] })

      renderFormattedHook({ chainIds: [UniverseChainId.Mainnet] })

      // Should only pass mainnetSwap (limit order filtered, arbitrum filtered)
      expect(formatTransactionsByDate).toHaveBeenCalledWith([mainnetSwap], expect.anything())
    })
  })

  describe('filterTransactionTypes', () => {
    it('should pass filterTransactionTypes to useListTransactions', () => {
      const { TransactionTypeFilter } = require('@uniswap/client-data-api/dist/data/v1/types_pb')
      const filterTypes = [TransactionTypeFilter.SWAP]

      renderFormattedHook({ filterTransactionTypes: filterTypes })

      expect(mockUseListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          filterTransactionTypes: filterTypes,
        }),
      )
    })

    it('should not include filterTransactionTypes when undefined', () => {
      renderFormattedHook()

      expect(mockUseListTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          filterTransactionTypes: undefined,
        }),
      )
    })
  })
})
