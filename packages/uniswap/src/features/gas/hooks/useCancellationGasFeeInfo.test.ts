import { useQuery } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { providers } from 'ethers'
import { useTransactionGasFee } from 'uniswap/src/features/gas/hooks'
import { useCancellationGasFeeInfo } from 'uniswap/src/features/gas/hooks/useCancellationGasFeeInfo'
import * as CancelUtils from 'uniswap/src/features/gas/utils/cancel'
import * as CancelMultipleOrders from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { getCancelOrderTxRequest } from 'uniswap/src/features/transactions/cancel/getCancelOrderTxRequest'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TransactionDetails, UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

// Mock QueryClient before any imports that might use it
jest.mock('@tanstack/react-query', () => ({
  QueryClient: jest.fn().mockImplementation(() => ({
    defaultOptions: {},
  })),
  useQuery: jest.fn(),
}))

jest.mock('ui/src/assets/logos/png/all-networks-icon.png', () => 'mocked-image', { virtual: true })
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('uniswap/src/features/gas/hooks', () => ({
  useTransactionGasFee: jest.fn(),
}))
jest.mock('uniswap/src/features/gas/utils/cancel', () => ({
  CancellationType: {
    Classic: 'classic',
    UniswapX: 'uniswapx',
  },
  getCancellationType: jest.fn(),
  createClassicCancelRequest: jest.fn(),
  calculateCancellationGasFee: jest.fn(),
}))
jest.mock('uniswap/src/features/transactions/cancel/getCancelOrderTxRequest')
jest.mock('uniswap/src/features/transactions/cancel/cancelMultipleOrders', () => ({
  extractCancellationData: jest.fn(),
  getCancelMultipleUniswapXOrdersTransaction: jest.fn(),
}))
jest.mock('uniswap/src/features/transactions/swap/utils/routing')

describe('useCancellationGasFeeInfo', () => {
  let mockUseTransactionGasFee: jest.Mock
  let mockCalculateCancellationGasFee: jest.Mock
  let mockGetCancellationType: jest.Mock
  let mockCreateClassicCancelRequest: jest.Mock
  let mockGetCancelOrderTxRequest: jest.Mock
  let mockExtractCancellationData: jest.Mock
  let mockGetCancelMultipleUniswapXOrdersTransaction: jest.Mock
  let mockIsUniswapX: jest.Mock
  let mockUseQuery: jest.Mock

  const mockTx: TransactionDetails = { id: 'mockTx', chainId: 1, from: '0x123' } as TransactionDetails
  const mockOrders: UniswapXOrderDetails[] = [{ id: 'mockOrder', orderHash: '0xorder1' } as UniswapXOrderDetails]
  const mockGasFee = { value: '100', displayValue: '0.1' }
  const mockClassicCancelRequest = { to: 'classic' } as providers.TransactionRequest
  const mockUniswapXCancelRequest = { to: 'uniswapx' } as providers.TransactionRequest

  beforeEach(() => {
    mockUseTransactionGasFee = useTransactionGasFee as jest.Mock
    mockCalculateCancellationGasFee = CancelUtils.calculateCancellationGasFee as jest.Mock
    mockGetCancellationType = CancelUtils.getCancellationType as jest.Mock
    mockCreateClassicCancelRequest = CancelUtils.createClassicCancelRequest as jest.Mock
    mockGetCancelOrderTxRequest = getCancelOrderTxRequest as jest.Mock
    mockExtractCancellationData = CancelMultipleOrders.extractCancellationData as jest.Mock
    mockGetCancelMultipleUniswapXOrdersTransaction =
      CancelMultipleOrders.getCancelMultipleUniswapXOrdersTransaction as jest.Mock
    mockIsUniswapX = isUniswapX as unknown as jest.Mock
    mockUseQuery = useQuery as jest.Mock

    mockUseTransactionGasFee.mockReturnValue(mockGasFee)
    mockCreateClassicCancelRequest.mockReturnValue(mockClassicCancelRequest)
    mockUseQuery.mockReturnValue({ data: mockUniswapXCancelRequest, isLoading: false, error: null })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return undefined if calculateCancellationGasFee returns undefined', () => {
    mockGetCancellationType.mockReturnValue(CancelUtils.CancellationType.Classic)
    mockCalculateCancellationGasFee.mockReturnValue(undefined)
    const { result } = renderHook(() => useCancellationGasFeeInfo(mockTx, mockOrders))
    expect(result.current).toBeUndefined()
  })

  describe('Classic Cancellations', () => {
    beforeEach(() => {
      mockGetCancellationType.mockReturnValue(CancelUtils.CancellationType.Classic)
    })

    it('should use classic cancellation request', () => {
      renderHook(() => useCancellationGasFeeInfo(mockTx))
      expect(mockUseTransactionGasFee).toHaveBeenCalledWith({
        tx: mockClassicCancelRequest,
        skip: false,
      })
    })

    it('should call calculateCancellationGasFee with correct params', () => {
      renderHook(() => useCancellationGasFeeInfo(mockTx))
      expect(mockCalculateCancellationGasFee).toHaveBeenCalledWith({
        type: CancelUtils.CancellationType.Classic,
        transaction: mockTx,
        gasFee: mockGasFee,
        cancelRequest: mockClassicCancelRequest,
        orders: undefined,
      })
    })
  })

  describe('with UniswapX orders', () => {
    beforeEach(() => {
      mockGetCancellationType.mockReturnValue(CancelUtils.CancellationType.UniswapX)
      mockExtractCancellationData.mockReturnValue([
        { orderHash: '0xorder1', encodedOrder: '0xencoded', routing: 'DUTCH_V2' },
      ])
      mockGetCancelMultipleUniswapXOrdersTransaction.mockResolvedValue(mockUniswapXCancelRequest)
      mockIsUniswapX.mockReturnValue(false)
    })

    it('should use UniswapX cancellation request for batch orders', () => {
      renderHook(() => useCancellationGasFeeInfo(mockTx, mockOrders))

      expect(mockUseQuery).toHaveBeenCalled()
      const queryCall = mockUseQuery.mock.calls[0]
      expect(queryCall?.[0]?.enabled).toBe(true)
      expect(queryCall?.[0]?.queryKey).toContain('batch')
    })

    it('should handle single UniswapX transaction', () => {
      mockIsUniswapX.mockReturnValue(true)
      mockGetCancelOrderTxRequest.mockResolvedValue(mockUniswapXCancelRequest)

      renderHook(() => useCancellationGasFeeInfo(mockTx))

      expect(mockUseQuery).toHaveBeenCalled()
      const queryCall = mockUseQuery.mock.calls[0]
      expect(queryCall?.[0]?.queryKey).toContain(mockTx.id)
    })

    it('should skip gas fee calculation when no cancel request', () => {
      mockUseQuery.mockReturnValue({ data: undefined, isLoading: false, error: null })

      renderHook(() => useCancellationGasFeeInfo(mockTx, mockOrders))

      expect(mockUseTransactionGasFee).toHaveBeenCalledWith({
        tx: undefined,
        skip: true,
      })
    })
  })
})
