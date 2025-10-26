import { renderHook } from '@testing-library/react'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'

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
      error: undefined,
      refetch: jest.fn(),
      status: 'success',
    })
  })

  it('should call REST API with correct parameters and return expected properties', () => {
    const { result } = renderHook(() =>
      useListTransactions({
        evmAddress: mockAddress,
        pageSize: mockPageSize,
      }),
    )

    expect(result.current).toHaveProperty('data')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('networkStatus')
    expect(result.current).toHaveProperty('refetch')
    expect(result.current).toHaveProperty('error')

    // Verify REST hook was called with correct parameters
    expect(mockUseListTransactionsQuery).toHaveBeenCalledWith({
      input: {
        evmAddress: mockAddress,
        chainIds: [1],
        pageSize: mockPageSize,
        fiatOnRampParams: undefined,
      },
      enabled: true,
      select: expect.any(Function),
    })
  })

  it('should skip REST API when address is not provided', () => {
    const { result } = renderHook(() =>
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
      select: expect.any(Function),
    })
  })

  it('should handle skip option correctly', () => {
    const mockRefetch = jest.fn()

    // Mock the REST hook to return our mock refetch function
    mockUseListTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      refetch: mockRefetch,
      status: 'success',
    })

    const { result } = renderHook(() =>
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
      select: expect.any(Function),
    })
  })

  it('should pass fiatOnRampParams to REST API', () => {
    const mockFiatOnRampParams = {} as const

    renderHook(() =>
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
      select: expect.any(Function),
    })
  })

  it('should use custom chainIds when provided', () => {
    const customChainIds = [42, 137]

    renderHook(() =>
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
      select: expect.any(Function),
    })
  })
})
