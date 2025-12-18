import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { SwapSummaryCallbacks } from 'uniswap/src/components/activity/types'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import { type UseActivityDataProps, useActivityData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { useFormattedTransactionDataForActivity } from 'uniswap/src/features/activity/hooks/useFormattedTransactionDataForActivity'
import { useHideSpamTokensSetting } from 'uniswap/src/features/settings/hooks'
import { TransactionDetails, TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { renderHookWithProviders } from 'uniswap/src/test/render'

// Mock dependencies
jest.mock('./useFormattedTransactionDataForActivity')
jest.mock('uniswap/src/features/settings/hooks')

const mockUseFormattedTransactionDataForActivity = useFormattedTransactionDataForActivity as jest.MockedFunction<
  typeof useFormattedTransactionDataForActivity
>
const mockUseHideSpamTokensSetting = useHideSpamTokensSetting as jest.MockedFunction<typeof useHideSpamTokensSetting>

describe('useActivityData', () => {
  const mockOwnerAddresses = ['0x123']
  const mockFiatOnRampParams = undefined
  const mockKeyExtractor = jest.fn((item: ActivityItem): string => {
    if (isLoadingItem(item)) {
      return `loading-${item.id}`
    }
    if (isSectionHeader(item)) {
      return `header-${item.title}`
    }
    // item is TransactionDetails
    return item.id
  })
  const mockFetchNextPage = jest.fn()
  const mockOnRetry = jest.fn().mockResolvedValue(undefined)

  const createMockTransaction = (id: string, type: TransactionType = TransactionType.Send): TransactionDetails =>
    ({
      id,
      typeInfo: {
        type,
      },
      addedTime: Date.now(),
    }) as TransactionDetails

  const mockTransaction = createMockTransaction('test-tx-1')

  const mockSwapCallbacks: SwapSummaryCallbacks = {
    useLatestSwapTransaction: jest.fn(),
    useSwapFormTransactionState: jest.fn(),
    onRetryGenerator: jest.fn(),
  }

  const baseProps: UseActivityDataProps = {
    ownerAddresses: mockOwnerAddresses,
    fiatOnRampParams: mockFiatOnRampParams,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseHideSpamTokensSetting.mockReturnValue(false)
    mockUseFormattedTransactionDataForActivity.mockReturnValue({
      isLoading: false,
      isFetching: false,
      isError: undefined,
      hasData: true,
      onRetry: mockOnRetry,
      sectionData: [mockTransaction],
      keyExtractor: mockKeyExtractor,
      fetchNextPage: mockFetchNextPage,
      hasNextPage: false,
      isFetchingNextPage: false,
    })
  })

  describe('basic functionality', () => {
    it('should return all expected properties', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.maybeEmptyComponent).toBeDefined()
      expect(result.current.renderActivityItem).toBeDefined()
      expect(result.current.sectionData).toBeDefined()
      expect(result.current.keyExtractor).toBeDefined()
      expect(result.current.fetchNextPage).toBeDefined()
      expect(result.current.hasNextPage).toBeDefined()
      expect(result.current.isFetchingNextPage).toBeDefined()
      expect(result.current.isLoading).toBeDefined()
      expect(result.current.isFetching).toBeDefined()
      expect(result.current.refetch).toBeDefined()
    })

    it('should pass through data from useFormattedTransactionDataForActivity', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.sectionData).toEqual([mockTransaction])
      expect(result.current.keyExtractor).toBe(mockKeyExtractor)
      expect(result.current.fetchNextPage).toBe(mockFetchNextPage)
      expect(result.current.refetch).toBe(mockOnRetry)
      expect(result.current.hasNextPage).toBe(false)
      expect(result.current.isFetchingNextPage).toBe(false)
      expect(result.current.isLoading).toBe(false)
    })

    it('should create renderActivityItem function', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      const renderer = result.current.renderActivityItem
      expect(renderer).toBeDefined()
      expect(typeof renderer).toBe('function')
    })
  })

  describe('loading states', () => {
    it('should handle loading state', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: true,
        isFetching: true,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.isLoading).toBe(true)
      expect(result.current.sectionData).toBeUndefined()
      expect(result.current.renderActivityItem).toBeDefined()
    })

    it('should handle fetching next page state', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: true,
        isError: undefined,
        hasData: true,
        onRetry: mockOnRetry,
        sectionData: [mockTransaction],
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: true,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.isFetchingNextPage).toBe(true)
      expect(result.current.hasNextPage).toBe(true)
    })
  })

  describe('error states', () => {
    it('should handle error state', () => {
      const mockError = new Error('Test error')
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: mockError,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.maybeEmptyComponent).toBeDefined()
      expect(result.current.renderActivityItem).toBeDefined()
    })

    it('should provide retry functionality on error', () => {
      const mockError = new Error('Test error')
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: mockError,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.refetch).toBe(mockOnRetry)
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      result.current.refetch()
      expect(mockOnRetry).toHaveBeenCalled()
    })
  })

  describe('empty states', () => {
    it('should handle empty sectionData', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.sectionData).toBeUndefined()
      expect(result.current.maybeEmptyComponent).toBeDefined()
      expect(result.current.renderActivityItem).toBeDefined()
    })

    it('should handle empty array sectionData', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: [],
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.sectionData).toEqual([])
      expect(result.current.maybeEmptyComponent).toBeDefined()
    })
  })

  describe('extraTransactions', () => {
    it('should prepend extraTransactions to sectionData', () => {
      const extraTransaction1 = createMockTransaction('extra-tx-1', TransactionType.Receive)
      const extraTransaction2 = createMockTransaction('extra-tx-2', TransactionType.Swap)

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            extraTransactions: [extraTransaction1, extraTransaction2],
          },
        ],
      })

      expect(result.current.sectionData).toEqual([extraTransaction1, extraTransaction2, mockTransaction])
    })

    it('should handle extraTransactions with empty sectionData', () => {
      const extraTransaction = createMockTransaction('extra-tx-1')
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            extraTransactions: [extraTransaction],
          },
        ],
      })

      expect(result.current.sectionData).toEqual([extraTransaction])
    })

    it('should handle empty extraTransactions array', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            extraTransactions: [],
          },
        ],
      })

      expect(result.current.sectionData).toEqual([mockTransaction])
    })
  })

  describe('swapCallbacks parameter', () => {
    it('should work correctly with swapCallbacks provided', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            swapCallbacks: mockSwapCallbacks,
          },
        ],
      })

      expect(result.current.renderActivityItem).toBeDefined()
      expect(result.current.sectionData).toEqual([mockTransaction])
    })

    it('should work correctly without swapCallbacks (backward compatibility)', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.renderActivityItem).toBeDefined()
      expect(result.current.sectionData).toEqual([mockTransaction])
    })

    it('should recreate renderActivityItem when swapCallbacks changes', () => {
      const { result, rerender } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      const initialRenderer = result.current.renderActivityItem

      // Add swapCallbacks
      rerender([
        {
          ...baseProps,
          swapCallbacks: mockSwapCallbacks,
        },
      ])

      expect(result.current.renderActivityItem).not.toBe(initialRenderer)
      expect(result.current.renderActivityItem).toBeDefined()

      // Remove swapCallbacks
      const rendererWithCallbacks = result.current.renderActivityItem
      rerender([baseProps])

      expect(result.current.renderActivityItem).not.toBe(rendererWithCallbacks)
      expect(result.current.renderActivityItem).toBeDefined()
    })
  })

  describe('other optional parameters', () => {
    it('should handle isExternalProfile prop', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            isExternalProfile: true,
          },
        ],
      })

      expect(result.current).toBeDefined()
      expect(result.current.sectionData).toEqual([mockTransaction])
    })

    it('should handle skip prop', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
        skip: true,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            skip: true,
          },
        ],
      })

      expect(result.current).toBeDefined()
    })

    it('should handle evmOwner and svmOwner props', () => {
      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            evmOwner: '0xevm123',
            svmOwner: '0xsvm456',
          },
        ],
      })

      expect(result.current).toBeDefined()
      expect(mockUseFormattedTransactionDataForActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          evmAddress: '0xevm123',
          svmAddress: '0xsvm456',
        }),
      )
    })

    it('should handle onPressEmptyState callback', () => {
      const mockOnPressEmptyState = jest.fn()
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: false,
        onRetry: mockOnRetry,
        sectionData: undefined,
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: false,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [
          {
            ...baseProps,
            onPressEmptyState: mockOnPressEmptyState,
          },
        ],
      })

      expect(result.current.maybeEmptyComponent).toBeDefined()
    })
  })

  describe('hideSpamTokens setting', () => {
    it('should pass hideSpamTokens to useFormattedTransactionDataForActivity', () => {
      mockUseHideSpamTokensSetting.mockReturnValue(true)

      renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(mockUseFormattedTransactionDataForActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          hideSpamTokens: true,
        }),
      )
    })

    it('should pass false when hideSpamTokens is disabled', () => {
      mockUseHideSpamTokensSetting.mockReturnValue(false)

      renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(mockUseFormattedTransactionDataForActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          hideSpamTokens: false,
        }),
      )
    })
  })

  describe('pagination', () => {
    it('should handle hasNextPage and fetchNextPage', () => {
      mockUseFormattedTransactionDataForActivity.mockReturnValue({
        isLoading: false,
        isFetching: false,
        isError: undefined,
        hasData: true,
        onRetry: mockOnRetry,
        sectionData: [mockTransaction],
        keyExtractor: mockKeyExtractor,
        fetchNextPage: mockFetchNextPage,
        hasNextPage: true,
        isFetchingNextPage: false,
      })

      const { result } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      expect(result.current.hasNextPage).toBe(true)
      expect(result.current.fetchNextPage).toBe(mockFetchNextPage)

      result.current.fetchNextPage()
      expect(mockFetchNextPage).toHaveBeenCalled()
    })
  })

  describe('prop updates', () => {
    it('should update when ownerAddresses changes', () => {
      const { rerender } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      const newOwnerAddresses = ['0x456', '0x789']
      rerender([
        {
          ...baseProps,
          ownerAddresses: newOwnerAddresses,
        },
      ])

      expect(mockUseFormattedTransactionDataForActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          ownerAddresses: newOwnerAddresses,
        }),
      )
    })

    it('should update when skip changes', () => {
      const { rerender } = renderHookWithProviders(useActivityData, {
        initialProps: [baseProps],
      })

      rerender([
        {
          ...baseProps,
          skip: true,
        },
      ])

      expect(mockUseFormattedTransactionDataForActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })
  })
})
