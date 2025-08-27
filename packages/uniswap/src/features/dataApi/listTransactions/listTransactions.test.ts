import { NetworkStatus } from '@apollo/client'
import { renderHook } from '@testing-library/react'
import { useListTransactions } from 'uniswap/src/features/dataApi/listTransactions/listTransactions'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

// Mock the feature flag hook
jest.mock('uniswap/src/features/gating/hooks', () => ({
  useFeatureFlag: jest.fn(),
}))

const mockUseFeatureFlag = useFeatureFlag as jest.Mock

// Mock the chains hook
jest.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: jest.fn(() => ({
    gqlChains: ['ETHEREUM'],
    chains: [1],
  })),
}))

// Mock the platform-based fetch policy hook
jest.mock('uniswap/src/utils/usePlatformBasedFetchPolicy', () => ({
  usePlatformBasedFetchPolicy: jest.fn(() => ({
    fetchPolicy: 'cache-first',
    pollInterval: undefined,
  })),
}))

// Mock the GraphQL hook while preserving actual exports (like enums used elsewhere)
jest.mock('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks', () => ({
  ...jest.requireActual('uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'),
  useTransactionListQuery: jest.fn(),
}))

// Mock the REST hook
jest.mock('uniswap/src/data/rest/listTransactions', () => ({
  useListTransactionsQuery: jest.fn(),
}))

const mockUseTransactionListQuery = jest.requireMock(
  'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks',
).useTransactionListQuery
const mockUseListTransactionsQuery = jest.requireMock('uniswap/src/data/rest/listTransactions').useListTransactionsQuery

describe('useListTransactions', () => {
  const mockAddress = '0x1234567890123456789012345678901234567890'
  const mockPageSize = 10

  beforeEach(() => {
    jest.clearAllMocks()

    // Default GraphQL mock
    mockUseTransactionListQuery.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: jest.fn(),
      error: undefined,
    })

    // Default REST mock
    mockUseListTransactionsQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: undefined,
      refetch: jest.fn(),
    })
  })

  describe('when REST feature flag is disabled', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(false)
    })

    it('should use GraphQL implementation and return expected properties', () => {
      const { result } = renderHook(() =>
        useListTransactions({
          address: mockAddress,
          pageSize: mockPageSize,
        }),
      )

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('networkStatus')
      expect(result.current).toHaveProperty('refetch')
      expect(result.current).toHaveProperty('error')

      // Verify GraphQL hook was called
      expect(mockUseTransactionListQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: {
            address: mockAddress,
            chains: ['ETHEREUM'],
            pageSize: mockPageSize,
          },
        }),
      )

      // Verify REST hook was called but with enabled: false
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

    it('should skip GraphQL when address is not provided', () => {
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

      // Verify GraphQL hook was called with skip: true
      expect(mockUseTransactionListQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })
  })

  describe('when REST feature flag is enabled', () => {
    beforeEach(() => {
      mockUseFeatureFlag.mockReturnValue(true)
    })

    it('should use REST implementation and return expected properties', () => {
      const { result } = renderHook(() =>
        useListTransactions({
          address: mockAddress,
          pageSize: mockPageSize,
        }),
      )

      expect(result.current).toHaveProperty('data')
      expect(result.current).toHaveProperty('loading')
      expect(result.current).toHaveProperty('networkStatus')
      expect(result.current).toHaveProperty('refetch')
      expect(result.current).toHaveProperty('error')

      // Verify REST hook was called
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

      // Verify GraphQL hook was called with skip: true
      expect(mockUseTransactionListQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
        }),
      )
    })

    it('should skip REST when address is not provided', () => {
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
          evmAddress: '',
          chainIds: [1],
          pageSize: mockPageSize,
          fiatOnRampParams: undefined,
        },
        enabled: false,
        select: expect.any(Function),
      })
    })
  })

  it('should handle query options correctly', () => {
    mockUseFeatureFlag.mockReturnValue(false)
    const mockRefetch = jest.fn()

    // Mock the GraphQL hook to return our mock refetch function
    mockUseTransactionListQuery.mockReturnValue({
      data: undefined,
      loading: false,
      networkStatus: NetworkStatus.ready,
      refetch: mockRefetch,
      error: undefined,
    })

    const { result } = renderHook(() =>
      useListTransactions({
        address: mockAddress,
        pageSize: mockPageSize,
        skip: true,
      }),
    )

    expect(result.current).toHaveProperty('refetch')
    expect(result.current.refetch).toBe(mockRefetch)

    // Verify GraphQL hook was called with skip: true
    expect(mockUseTransactionListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })

  it('should use internal select function and handle fiatOnRampParams in REST implementation', () => {
    mockUseFeatureFlag.mockReturnValue(true)

    renderHook(() =>
      useListTransactions({
        address: mockAddress,
        pageSize: mockPageSize,
      }),
    )

    // Verify REST hook receives the internal select function and handles fiatOnRampParams
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

    // Verify GraphQL hook is skipped
    expect(mockUseTransactionListQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: true,
      }),
    )
  })
})
