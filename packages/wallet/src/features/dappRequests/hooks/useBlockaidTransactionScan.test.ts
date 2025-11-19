import { waitFor } from '@testing-library/react-native'
import { BlockaidScanTransactionRequest, SharedQueryClient } from '@universe/api'
import { BlockaidApiClient } from 'uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient'
import { useBlockaidTransactionScan } from 'wallet/src/features/dappRequests/hooks/useBlockaidTransactionScan'
import { renderHook } from 'wallet/src/test/test-utils'

// Mock the BlockaidApiClient
jest.mock('uniswap/src/data/apiClients/blockaidApi/BlockaidApiClient', () => ({
  BlockaidApiClient: {
    scanTransaction: jest.fn(),
  },
}))

const mockScanTransaction = BlockaidApiClient.scanTransaction as jest.MockedFunction<
  typeof BlockaidApiClient.scanTransaction
>

describe('useBlockaidTransactionScan', () => {
  const createMockRequest = (overrides?: Partial<BlockaidScanTransactionRequest>): BlockaidScanTransactionRequest => ({
    chain: 'ethereum',
    account_address: '0x1234567890123456789012345678901234567890',
    metadata: {
      domain: 'example.com',
    },
    data: {
      to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
      data: '0x095ea7b3000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000ff',
      value: '0x0',
      from: '0x1234567890123456789012345678901234567890',
      nonce: '0x1',
    },
    ...overrides,
  })

  const mockScanResult = {
    chain: 'ethereum',
    block: '12345',
    validation: {
      status: 'Success' as const,
      result_type: 'benign',
      description: 'Safe transaction',
      reason: 'No malicious activity detected',
      classification: 'safe',
      features: [],
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockScanTransaction.mockReset()
    // Clear the query cache to ensure test isolation
    SharedQueryClient.clear()
  })

  it('should return loading state initially', () => {
    mockScanTransaction.mockResolvedValue(mockScanResult)
    const request = createMockRequest()

    const { result } = renderHook(() => useBlockaidTransactionScan(request))

    expect(result.current.isLoading).toBe(true)
    expect(result.current.scanResult).toBeUndefined()
  })

  it('should fetch and return scan result when request is provided', async () => {
    mockScanTransaction.mockResolvedValue(mockScanResult)
    const request = createMockRequest()

    const { result } = renderHook(() => useBlockaidTransactionScan(request))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.scanResult).toEqual(mockScanResult)
    expect(mockScanTransaction).toHaveBeenCalledWith(request)
    expect(mockScanTransaction).toHaveBeenCalledTimes(1)
  })

  it('should not fetch when request is null', () => {
    const { result } = renderHook(() => useBlockaidTransactionScan(null))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.scanResult).toBeUndefined()
    expect(mockScanTransaction).not.toHaveBeenCalled()
  })

  it('should not fetch when enabled is false', () => {
    const request = createMockRequest()

    const { result } = renderHook(() => useBlockaidTransactionScan(request, false))

    expect(result.current.isLoading).toBe(false)
    expect(result.current.scanResult).toBeUndefined()
    expect(mockScanTransaction).not.toHaveBeenCalled()
  })

  it('should return null on API failure', async () => {
    mockScanTransaction.mockRejectedValue(new Error('API Error'))
    const request = createMockRequest()

    const { result } = renderHook(() => useBlockaidTransactionScan(request))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.scanResult).toBeUndefined()
  })

  describe('cache key optimization', () => {
    it('should use the same cache for identical transaction data (hashed efficiently)', async () => {
      mockScanTransaction.mockResolvedValue(mockScanResult)

      const request1 = createMockRequest({
        data: {
          to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          // Large hex data should be hashed efficiently
          data: '0x095ea7b3' + '0'.repeat(1000),
          value: '0x0',
          from: '0x1234567890123456789012345678901234567890',
        },
      })
      const request2 = createMockRequest({
        data: {
          to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          // Same large hex data - hash should match
          data: '0x095ea7b3' + '0'.repeat(1000),
          value: '0x0',
          from: '0x1234567890123456789012345678901234567890',
        },
      })

      // Render first hook
      const { result: result1 } = renderHook(() => useBlockaidTransactionScan(request1))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(mockScanTransaction).toHaveBeenCalledTimes(1)

      // Render second hook with identical data - should use cache
      const { result: result2 } = renderHook(() => useBlockaidTransactionScan(request2))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should not call API again due to cache hit
      expect(mockScanTransaction).toHaveBeenCalledTimes(1)
      expect(result2.current.scanResult).toEqual(mockScanResult)
    })

    it('should use different cache for different transaction data', async () => {
      mockScanTransaction.mockResolvedValue(mockScanResult)

      const request1 = createMockRequest({
        data: {
          to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          data: '0x095ea7b3',
        },
      })

      const request2 = createMockRequest({
        data: {
          to: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
          data: '0x12345678', // Different data
        },
      })

      // Render first hook
      const { result: result1 } = renderHook(() => useBlockaidTransactionScan(request1))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(mockScanTransaction).toHaveBeenCalledTimes(1)

      // Render second hook with different data - should NOT use cache
      const { result: result2 } = renderHook(() => useBlockaidTransactionScan(request2))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should call API again for different transaction data
      expect(mockScanTransaction).toHaveBeenCalledTimes(2)
    })

    it('should use different cache for different chains', async () => {
      mockScanTransaction.mockResolvedValue(mockScanResult)

      const request1 = createMockRequest({ chain: 'ethereum' })
      const request2 = createMockRequest({ chain: 'polygon' })

      // Render first hook
      const { result: result1 } = renderHook(() => useBlockaidTransactionScan(request1))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(mockScanTransaction).toHaveBeenCalledTimes(1)

      // Render second hook with different chain - should NOT use cache
      const { result: result2 } = renderHook(() => useBlockaidTransactionScan(request2))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should call API again for different chain
      expect(mockScanTransaction).toHaveBeenCalledTimes(2)
    })

    it('should use different cache for different account addresses', async () => {
      mockScanTransaction.mockResolvedValue(mockScanResult)

      const request1 = createMockRequest({ account_address: '0x1111111111111111111111111111111111111111' })
      const request2 = createMockRequest({ account_address: '0x2222222222222222222222222222222222222222' })

      // Render first hook
      const { result: result1 } = renderHook(() => useBlockaidTransactionScan(request1))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(mockScanTransaction).toHaveBeenCalledTimes(1)

      // Render second hook with different account - should NOT use cache
      const { result: result2 } = renderHook(() => useBlockaidTransactionScan(request2))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should call API again for different account
      expect(mockScanTransaction).toHaveBeenCalledTimes(2)
    })

    it('should use different cache for different dapp domains', async () => {
      mockScanTransaction.mockResolvedValue(mockScanResult)

      const request1 = createMockRequest({ metadata: { domain: 'example.com' } })
      const request2 = createMockRequest({ metadata: { domain: 'malicious.com' } })

      // Render first hook
      const { result: result1 } = renderHook(() => useBlockaidTransactionScan(request1))

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false)
      })

      expect(mockScanTransaction).toHaveBeenCalledTimes(1)

      // Render second hook with different domain - should NOT use cache
      const { result: result2 } = renderHook(() => useBlockaidTransactionScan(request2))

      await waitFor(() => {
        expect(result2.current.isLoading).toBe(false)
      })

      // Should call API again for different domain
      expect(mockScanTransaction).toHaveBeenCalledTimes(2)
    })
  })
})
