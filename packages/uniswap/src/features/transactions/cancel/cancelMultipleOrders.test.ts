import { TradingApi } from '@universe/api'
import { ContractTransaction, providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  cancelMultipleUniswapXOrders,
  extractCancellationData,
  fetchLimitOrdersEncodedOrderData,
  getCancelMultipleUniswapXOrdersTransaction,
  getOrdersMatchingCancellationData,
  LimitOrdersFetcher,
  trackOrderCancellation,
} from 'uniswap/src/features/transactions/cancel/cancelMultipleOrders'
import { buildBatchCancellation } from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

jest.mock('uniswap/src/features/telemetry/send')
jest.mock('uniswap/src/features/transactions/cancel/cancelOrderFactory', () => ({
  buildBatchCancellation: jest.fn(),
}))
jest.mock('uniswap/src/features/transactions/swap/orders', () => ({
  getOrders: jest.fn(),
}))
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

describe('useCancelMultipleOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('trackOrderCancellation', () => {
    it('should send analytics event with order hashes', () => {
      const orders = [
        uniswapXOrderDetails({ orderHash: '0x123' }),
        uniswapXOrderDetails({ orderHash: '0x456' }),
        uniswapXOrderDetails({ orderHash: undefined }),
      ]

      trackOrderCancellation(orders)

      expect(sendAnalyticsEvent).toHaveBeenCalledWith(InterfaceEventName.UniswapXOrderCancelInitiated, {
        orders: ['0x123', '0x456'],
      })
    })
  })

  describe('extractCancellationData', () => {
    it('should extract valid cancellation data from orders', () => {
      const orders: UniswapXOrderDetails[] = [
        uniswapXOrderDetails({
          orderHash: '0x123',
          encodedOrder: '0xencoded1',
          routing: TradingApi.Routing.DUTCH_V2,
        }),
        uniswapXOrderDetails({
          orderHash: '0x456',
          encodedOrder: '0xencoded2',
          routing: TradingApi.Routing.DUTCH_V3,
        }),
        uniswapXOrderDetails({
          orderHash: undefined,
          encodedOrder: '0xencoded3',
          routing: TradingApi.Routing.PRIORITY,
        }),
        uniswapXOrderDetails({
          orderHash: '0x789',
          encodedOrder: undefined,
          routing: TradingApi.Routing.DUTCH_LIMIT,
        }),
      ]

      const result = extractCancellationData(orders)

      expect(result).toEqual([
        { orderHash: '0x123', encodedOrder: '0xencoded1', routing: TradingApi.Routing.DUTCH_V2 },
        { orderHash: '0x456', encodedOrder: '0xencoded2', routing: TradingApi.Routing.DUTCH_V3 },
      ])
    })
  })

  describe('getOrdersMatchingCancellationData', () => {
    it('should filter orders based on cancellation data', () => {
      const allOrders = [
        uniswapXOrderDetails({ orderHash: '0x123' }),
        uniswapXOrderDetails({ orderHash: '0x456' }),
        uniswapXOrderDetails({ orderHash: '0x789' }),
      ]

      const cancellationData = [{ orderHash: '0x123' }, { orderHash: '0x789' }]

      const result = getOrdersMatchingCancellationData(allOrders, cancellationData)

      expect(result).toHaveLength(2)
      expect(result[0]?.orderHash).toBe('0x123')
      expect(result[1]?.orderHash).toBe('0x789')
    })
  })

  describe('fetchEncodedOrderData', () => {
    const { getOrders } = jest.requireMock('uniswap/src/features/transactions/swap/orders')

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should fetch limit orders with injected fetcher', async () => {
      const limitOrders = [
        uniswapXOrderDetails({
          orderHash: '0xlimit1',
          encodedOrder: undefined,
          routing: TradingApi.Routing.DUTCH_LIMIT,
        }),
        uniswapXOrderDetails({
          orderHash: '0xlimit2',
          encodedOrder: undefined,
          routing: TradingApi.Routing.DUTCH_LIMIT,
        }),
      ]

      const mockLimitOrdersFetcher: LimitOrdersFetcher = jest.fn().mockResolvedValue([
        {
          orderHash: '0xlimit1',
          encodedOrder: '0xencodedLimit1',
          orderStatus: TradingApi.OrderStatus.OPEN,
        },
        {
          orderHash: '0xlimit2',
          encodedOrder: '0xencodedLimit2',
          orderStatus: TradingApi.OrderStatus.OPEN,
        },
      ])

      const result = await fetchLimitOrdersEncodedOrderData(limitOrders, mockLimitOrdersFetcher)

      expect(mockLimitOrdersFetcher).toHaveBeenCalledWith(['0xlimit1', '0xlimit2'])
      expect(result).toHaveLength(2)
      expect(result).toEqual([
        { orderHash: '0xlimit1', encodedOrder: '0xencodedLimit1', routing: TradingApi.Routing.DUTCH_LIMIT },
        { orderHash: '0xlimit2', encodedOrder: '0xencodedLimit2', routing: TradingApi.Routing.DUTCH_LIMIT },
      ])
    })
    it('should return empty array when no fetcher provided for limit orders', async () => {
      const limitOrders = [
        uniswapXOrderDetails({
          orderHash: '0xlimit1',
          encodedOrder: undefined,
          routing: TradingApi.Routing.DUTCH_LIMIT,
        }),
      ]

      const result = await fetchLimitOrdersEncodedOrderData(limitOrders)

      expect(result).toEqual([])
    })

    it('should skip orders that already have encodedOrder', async () => {
      const orders = [
        uniswapXOrderDetails({
          orderHash: '0x123',
          encodedOrder: '0xalreadyEncoded',
          routing: TradingApi.Routing.DUTCH_V2,
        }),
      ]

      const result = await fetchLimitOrdersEncodedOrderData(orders)

      expect(getOrders).not.toHaveBeenCalled()
      expect(result).toEqual([])
    })

    it('should handle errors gracefully', async () => {
      const orders = [
        uniswapXOrderDetails({
          orderHash: '0x123',
          encodedOrder: undefined,
          routing: TradingApi.Routing.DUTCH_V2,
        }),
      ]

      getOrders.mockRejectedValue(new Error('API error'))

      const result = await fetchLimitOrdersEncodedOrderData(orders)

      expect(result).toEqual([])
    })
  })

  describe('getCancelMultipleUniswapXOrdersTransaction', () => {
    const mockBuildBatchCancellation = buildBatchCancellation as jest.Mock

    beforeEach(() => {
      mockBuildBatchCancellation.mockClear()
    })

    it('should return undefined for empty orders', async () => {
      const result = await getCancelMultipleUniswapXOrdersTransaction({
        orders: [],
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
      })

      expect(result).toBeUndefined()
      expect(mockBuildBatchCancellation).not.toHaveBeenCalled()
    })

    it('should build transaction for single order', async () => {
      const mockTx = { to: '0xpermit2', data: '0xcancel' }
      mockBuildBatchCancellation.mockResolvedValue(mockTx)

      const orders = [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }]

      const result = await getCancelMultipleUniswapXOrdersTransaction({
        orders,
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
      })

      expect(result).toEqual(mockTx)
      expect(mockBuildBatchCancellation).toHaveBeenCalledWith(
        [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2, chainId: UniverseChainId.Mainnet }],
        '0xuser',
      )
    })

    it('should return first transaction when multiple are returned', async () => {
      const mockTxs = [
        { to: '0xpermit2', data: '0xcancel1' },
        { to: '0xpermit2', data: '0xcancel2' },
      ]
      mockBuildBatchCancellation.mockResolvedValue(mockTxs)

      const orders = [
        { encodedOrder: '0xencoded1', routing: TradingApi.Routing.DUTCH_V2 },
        { encodedOrder: '0xencoded2', routing: TradingApi.Routing.DUTCH_V3 },
      ]

      const result = await getCancelMultipleUniswapXOrdersTransaction({
        orders,
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
      })

      expect(result).toEqual(mockTxs[0])
    })

    it('should handle errors gracefully', async () => {
      mockBuildBatchCancellation.mockRejectedValue(new Error('Build failed'))

      const orders = [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }]

      const result = await getCancelMultipleUniswapXOrdersTransaction({
        orders,
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
      })

      expect(result).toBeUndefined()
    })
  })

  describe('cancelMultipleUniswapXOrders', () => {
    const mockBuildBatchCancellation = buildBatchCancellation as jest.Mock
    let mockSigner: {
      sendTransaction: jest.Mock
    }
    let mockProvider: jest.Mocked<providers.Web3Provider>

    beforeEach(() => {
      mockSigner = {
        sendTransaction: jest.fn(),
      }

      mockProvider = {
        getSigner: jest.fn().mockReturnValue(mockSigner),
      } as unknown as jest.Mocked<providers.Web3Provider>

      mockBuildBatchCancellation.mockClear()
    })

    it('should cancel single order', async () => {
      const mockTx = { to: '0xpermit2', data: '0xcancel' }
      const mockSentTx = { hash: '0xtxhash' } as ContractTransaction

      mockBuildBatchCancellation.mockResolvedValue(mockTx)
      mockSigner.sendTransaction.mockResolvedValue(mockSentTx)

      const orders = [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }]

      const result = await cancelMultipleUniswapXOrders({
        orders,
        chainId: UniverseChainId.Mainnet,
        signerAddress: '0xuser',
        provider: mockProvider,
      })

      expect(result).toEqual([mockSentTx])
      expect(mockProvider.getSigner).toHaveBeenCalled()
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(mockTx)
    })

    it('should cancel multiple orders with multiple transactions', async () => {
      const mockTxs = [
        { to: '0xpermit2', data: '0xcancel1' },
        { to: '0xpermit2', data: '0xcancel2' },
      ]
      const mockSentTxs = [{ hash: '0xtxhash1' } as ContractTransaction, { hash: '0xtxhash2' } as ContractTransaction]

      mockBuildBatchCancellation.mockResolvedValue(mockTxs)
      mockSigner.sendTransaction.mockResolvedValueOnce(mockSentTxs[0]).mockResolvedValueOnce(mockSentTxs[1])

      const orders = [
        { encodedOrder: '0xencoded1', routing: TradingApi.Routing.DUTCH_V2 },
        { encodedOrder: '0xencoded2', routing: TradingApi.Routing.DUTCH_V3 },
      ]

      const result = await cancelMultipleUniswapXOrders({
        orders,
        chainId: UniverseChainId.Mainnet,
        signerAddress: '0xuser',
        provider: mockProvider,
      })

      expect(result).toEqual(mockSentTxs)
      expect(mockSigner.sendTransaction).toHaveBeenCalledTimes(2)
    })

    it('should use specific signer when provided', async () => {
      const mockTx = { to: '0xpermit2', data: '0xcancel' }
      const mockSentTx = { hash: '0xtxhash' } as ContractTransaction

      mockBuildBatchCancellation.mockResolvedValue(mockTx)
      mockSigner.sendTransaction.mockResolvedValue(mockSentTx)

      const result = await cancelMultipleUniswapXOrders({
        orders: [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }],
        chainId: UniverseChainId.Mainnet,
        signerAddress: '0xspecificsigner',
        provider: mockProvider,
      })

      expect(result).toEqual([mockSentTx])
      expect(mockProvider.getSigner).toHaveBeenCalledWith('0xspecificsigner')
      expect(mockSigner.sendTransaction).toHaveBeenCalledWith(mockTx)
    })

    it('should return undefined if no provider available', async () => {
      const result = await cancelMultipleUniswapXOrders({
        orders: [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }],
        chainId: UniverseChainId.Mainnet,
      })

      expect(result).toBeUndefined()
    })

    it('should return undefined if factory function returns null', async () => {
      mockBuildBatchCancellation.mockResolvedValue(null)

      const result = await cancelMultipleUniswapXOrders({
        orders: [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }],
        chainId: UniverseChainId.Mainnet,
        signerAddress: '0xuser',
        provider: mockProvider,
      })

      expect(result).toBeUndefined()
    })

    it('should handle errors gracefully', async () => {
      mockBuildBatchCancellation.mockRejectedValue(new Error('Build failed'))

      const result = await cancelMultipleUniswapXOrders({
        orders: [{ encodedOrder: '0xencoded', routing: TradingApi.Routing.DUTCH_V2 }],
        chainId: UniverseChainId.Mainnet,
        signerAddress: '0xuser',
        provider: mockProvider,
      })

      expect(result).toBeUndefined()
    })
  })
})
