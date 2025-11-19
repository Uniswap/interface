import { renderHook } from '@testing-library/react'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { renderHookWithProviders } from 'uniswap/src/test/render'

// Mock the chains hook
jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(() => ({
    chains: [1],
  })),
}))

// Mock the REST hook
jest.mock('uniswap/src/data/rest/listTransactions', () => ({
  useListTransactionsQuery: jest.fn(),
}))

const mockUseListTransactionsQuery = jest.requireMock('uniswap/src/data/rest/listTransactions').useListTransactionsQuery

describe('useListTransactions', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  const mockPageSize = 10

  beforeEach(() => {
    jest.clearAllMocks()

    // Default REST mock
    mockUseListTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: jest.fn(),
      status: 'success',
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
  })

  it('should call REST API with correct parameters and return expected properties', () => {
    const { result } = renderHookWithProviders(() =>
      useListTransactions({
        evmAddress: mockAddress,
        pageSize: mockPageSize,
      }),
    )

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('isFetching')
    expect(result.current).toHaveProperty('networkStatus')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('error')
    expect(result.current).toHaveProperty('fetchNextPage')
    expect(result.current).toHaveProperty('hasNextPage')
    expect(result.current).toHaveProperty('isFetchingNextPage')

    // Verify REST hook was called with correct parameters
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: mockAddress,
        chainIds: [1],
        pageSize: mockPageSize,
        fiatOnRampParams: undefined,
      },
      enabled: true,
    })
  })

  it('should skip REST API when address is not provided', () => {
    const { result } = renderHookWithProviders(() =>
      useListTransactions({
        pageSize: mockPageSize,
      }),
    )

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('networkStatus')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('error')

    // Verify REST hook was called with enabled: false
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: undefined,
        svmAddress: undefined,
        chainIds: [1],
        pageSize: mockPageSize,
        fiatOnRampParams: undefined,
      },
      enabled: false,
    })
  })

  it('should handle skip option correctly', () => {
    const mockRefetch = jest.fn()

    // Mock the REST hook to return our mock refetch function
    mockUseListTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      error: undefined,
      refetch: mockRefetch,
      status: 'success',
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })

    const { result } = renderHookWithProviders(() =>
      useListTransactions({
        evmAddress: mockAddress,
        pageSize: mockPageSize,
        skip: true,
      }),
    )

    expect(result.current).toHaveProperty('refetch')
    expect(result.current.refetch).toBe(mockRefetch)

    // Verify REST hook was called with enabled: false due to skip
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: mockAddress,
        chainIds: [1],
        pageSize: mockPageSize,
        fiatOnRampParams: undefined,
      },
      enabled: false,
    })
  })

  it('should pass fiatOnRampParams to REST API', () => {
    const mockFiatOnRampParams = {} as const

    renderHookWithProviders(() =>
      useListTransactions({
        evmAddress: mockAddress,
        pageSize: mockPageSize,
        fiatOnRampParams: mockFiatOnRampParams,
      }),
    )

    // Verify REST hook receives the fiatOnRampParams
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: mockAddress,
        chainIds: [1],
        pageSize: mockPageSize,
        fiatOnRampParams: mockFiatOnRampParams,
      },
      enabled: true,
    })
  })

  it('should use custom chainIds when provided', () => {
    const customChainIds = [42, 137]

    renderHookWithProviders(() =>
      useListTransactions({
        evmAddress: mockAddress,
        pageSize: mockPageSize,
        chainIds: customChainIds,
      }),
    )

    // Verify REST hook uses custom chainIds
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: mockAddress,
        chainIds: customChainIds,
        pageSize: mockPageSize,
        fiatOnRampParams: undefined,
      },
      enabled: true,
    })
  })
})
