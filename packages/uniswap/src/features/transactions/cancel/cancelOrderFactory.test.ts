import { BigNumber } from '@ethersproject/bignumber'
import {
  CosignedPriorityOrder,
  CosignedV2DutchOrder,
  CosignedV3DutchOrder,
  DutchOrder,
  getCancelMultipleParams,
  getCancelSingleParams,
} from '@uniswap/uniswapx-sdk'
import { TradingApi } from '@universe/api'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  buildBatchCancellation,
  buildSingleCancellation,
  OrderCancellationParams,
} from 'uniswap/src/features/transactions/cancel/cancelOrderFactory'
import { createPermit2Contract } from 'uniswap/src/features/transactions/utils/permit2'

// Mock the logger to suppress debug logs during tests
jest.mock('utilities/src/logger/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock the uniswapx-sdk functions
jest.mock('@uniswap/uniswapx-sdk', () => ({
  ...jest.requireActual('@uniswap/uniswapx-sdk'),
  getCancelSingleParams: jest.fn(),
  getCancelMultipleParams: jest.fn(),
  CosignedV2DutchOrder: {
    parse: jest.fn(),
  },
  CosignedV3DutchOrder: {
    parse: jest.fn(),
  },
  CosignedPriorityOrder: {
    parse: jest.fn(),
  },
  DutchOrder: {
    parse: jest.fn(),
  },
}))

// Mock the permit2 contract creation
jest.mock('uniswap/src/features/transactions/utils/permit2', () => ({
  createPermit2Contract: jest.fn(),
}))

describe('cancelOrderFactory', () => {
  const mockNonce = BigNumber.from('12345')
  const mockFrom = '0x1234567890abcdef'
  const chainId = UniverseChainId.Mainnet

  const mockPermit2 = {
    populateTransaction: {
      invalidateUnorderedNonces: jest.fn().mockResolvedValue({
        to: '0xpermit2address',
        data: '0xcanceldata',
        value: '0x0',
      }),
    },
  }

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup mock for permit2 creation
    ;(createPermit2Contract as jest.Mock).mockReturnValue(mockPermit2)

    // Setup default mock behavior
    const getCancelSingleParamsMock = getCancelSingleParams as jest.Mock
    const getCancelMultipleParamsMock = getCancelMultipleParams as jest.Mock
    getCancelSingleParamsMock.mockReturnValue({ word: '0x123', mask: '0x456' })
    getCancelMultipleParamsMock.mockReturnValue([{ word: '0x789', mask: '0xabc' }])

    const mockParsedOrder = {
      info: { nonce: mockNonce },
    }
    const cosignedV2Parse = CosignedV2DutchOrder.parse as jest.Mock
    const cosignedV3Parse = CosignedV3DutchOrder.parse as jest.Mock
    const cosignedPriorityParse = CosignedPriorityOrder.parse as jest.Mock
    const dutchOrderParse = DutchOrder.parse as jest.Mock
    cosignedV2Parse.mockReturnValue(mockParsedOrder)
    cosignedV3Parse.mockReturnValue(mockParsedOrder)
    cosignedPriorityParse.mockReturnValue(mockParsedOrder)
    dutchOrderParse.mockReturnValue(mockParsedOrder)
  })

  describe('buildSingleCancellation', () => {
    const mockOrder: OrderCancellationParams = {
      encodedOrder: '0xencodedorder',
      routing: TradingApi.Routing.DUTCH_V2,
      chainId,
      orderHash: '0xhash',
    }

    it('should build a single cancellation transaction', async () => {
      const result = await buildSingleCancellation(mockOrder, mockFrom)

      expect(result).toEqual({
        to: '0xpermit2address',
        data: '0xcanceldata',
        value: '0x0',
        from: mockFrom,
        chainId,
      })

      expect(createPermit2Contract).toHaveBeenCalledTimes(1)
      expect(getCancelSingleParams).toHaveBeenCalledWith(mockNonce)
      expect(mockPermit2.populateTransaction.invalidateUnorderedNonces).toHaveBeenCalledWith('0x123', '0x456')
    })

    it('should return null when order parsing fails', async () => {
      const cosignedV2Parse = CosignedV2DutchOrder.parse as jest.Mock
      cosignedV2Parse.mockImplementationOnce(() => {
        throw new Error('Parse error')
      })

      const result = await buildSingleCancellation(mockOrder, mockFrom)
      expect(result).toBeNull()
    })

    it('should handle different routing types', async () => {
      const orderTypes = [
        { routing: TradingApi.Routing.DUTCH_V2, parser: 'CosignedV2DutchOrder' },
        { routing: TradingApi.Routing.DUTCH_V3, parser: 'CosignedV3DutchOrder' },
        { routing: TradingApi.Routing.PRIORITY, parser: 'CosignedPriorityOrder' },
        { routing: TradingApi.Routing.DUTCH_LIMIT, parser: 'DutchOrder' },
      ]

      for (const { routing, parser } of orderTypes) {
        const order = { ...mockOrder, routing }
        await buildSingleCancellation(order, mockFrom)

        let parseMethod: jest.Mock
        switch (parser) {
          case 'CosignedV2DutchOrder':
            parseMethod = CosignedV2DutchOrder.parse as jest.Mock
            break
          case 'CosignedV3DutchOrder':
            parseMethod = CosignedV3DutchOrder.parse as jest.Mock
            break
          case 'CosignedPriorityOrder':
            parseMethod = CosignedPriorityOrder.parse as jest.Mock
            break
          case 'DutchOrder':
            parseMethod = DutchOrder.parse as jest.Mock
            break
          default:
            throw new Error(`Unknown parser: ${parser}`)
        }

        expect(parseMethod).toHaveBeenCalledWith(order.encodedOrder, chainId)
      }
    })

    it('should return null when nonce extraction fails', async () => {
      const cosignedV2Parse = CosignedV2DutchOrder.parse as jest.Mock
      cosignedV2Parse.mockReturnValue({ info: {} }) // Missing nonce

      const result = await buildSingleCancellation(mockOrder, mockFrom)
      expect(result).toBeNull()
    })
  })

  describe('buildBatchCancellation', () => {
    const mockOrders: OrderCancellationParams[] = [
      { encodedOrder: '0xencodedorder1', routing: TradingApi.Routing.DUTCH_V2, chainId, orderHash: '0xhash1' },
      { encodedOrder: '0xencodedorder2', routing: TradingApi.Routing.DUTCH_V3, chainId, orderHash: '0xhash2' },
    ]

    it('should return null for empty orders array', async () => {
      const result = await buildBatchCancellation([], mockFrom)
      expect(result).toBeNull()
    })

    it('should use buildSingleCancellation for single order', async () => {
      const singleOrder = [mockOrders[0]] as OrderCancellationParams[]

      const result = await buildBatchCancellation(singleOrder, mockFrom)

      expect(result).toEqual({
        to: '0xpermit2address',
        data: '0xcanceldata',
        value: '0x0',
        from: mockFrom,
        chainId,
      })

      expect(getCancelMultipleParams).not.toHaveBeenCalled()
      expect(getCancelSingleParams).toHaveBeenCalledWith(mockNonce)
    })

    it('should build batch cancellation for multiple orders', async () => {
      const result = await buildBatchCancellation(mockOrders, mockFrom)

      expect(result).toEqual({
        to: '0xpermit2address',
        data: '0xcanceldata',
        value: '0x0',
        from: mockFrom,
        chainId,
      })

      expect(createPermit2Contract).toHaveBeenCalledTimes(1)
      expect(getCancelMultipleParams).toHaveBeenCalledWith([mockNonce, mockNonce])
      expect(mockPermit2.populateTransaction.invalidateUnorderedNonces).toHaveBeenCalledWith('0x789', '0xabc')
    })

    it('should handle multiple word/mask pairs', async () => {
      const getCancelMultipleParamsMock = getCancelMultipleParams as jest.Mock
      getCancelMultipleParamsMock.mockReturnValue([
        { word: '0x111', mask: '0x222' },
        { word: '0x333', mask: '0x444' },
      ])

      const result = await buildBatchCancellation(mockOrders, mockFrom)

      expect(Array.isArray(result)).toBe(true)
      expect(result).toHaveLength(2)
      expect(mockPermit2.populateTransaction.invalidateUnorderedNonces).toHaveBeenCalledTimes(2)
      expect(mockPermit2.populateTransaction.invalidateUnorderedNonces).toHaveBeenCalledWith('0x111', '0x222')
      expect(mockPermit2.populateTransaction.invalidateUnorderedNonces).toHaveBeenCalledWith('0x333', '0x444')
    })

    it('should filter out invalid orders', async () => {
      const cosignedV3Parse = CosignedV3DutchOrder.parse as jest.Mock
      cosignedV3Parse.mockImplementationOnce(() => {
        throw new Error('Parse error')
      })

      const result = await buildBatchCancellation(mockOrders, mockFrom)

      expect(result).not.toBeNull()
      expect(getCancelMultipleParams).toHaveBeenCalledWith([mockNonce]) // Only one valid nonce
    })

    it('should return null if all orders are invalid', async () => {
      const cosignedV2Parse = CosignedV2DutchOrder.parse as jest.Mock
      const cosignedV3Parse = CosignedV3DutchOrder.parse as jest.Mock
      cosignedV2Parse.mockImplementation(() => {
        throw new Error('Parse error')
      })
      cosignedV3Parse.mockImplementation(() => {
        throw new Error('Parse error')
      })

      const result = await buildBatchCancellation(mockOrders, mockFrom)
      expect(result).toBeNull()
    })

    it('should return null if orders are from different chains', async () => {
      const mixedChainOrders: OrderCancellationParams[] = [
        { ...mockOrders[0]!, chainId: UniverseChainId.Mainnet },
        { ...mockOrders[1]!, chainId: UniverseChainId.ArbitrumOne },
      ]

      const result = await buildBatchCancellation(mixedChainOrders, mockFrom)
      expect(result).toBeNull()
    })

    it('should handle empty orders array gracefully', async () => {
      const ordersWithEmpty: OrderCancellationParams[] = []

      const result = await buildBatchCancellation(ordersWithEmpty, mockFrom)
      expect(result).toBeNull()
    })

    it('should handle orders array with undefined elements', async () => {
      // This tests the case where orders[0] could be undefined
      const result = await buildBatchCancellation([mockOrders[0]!], mockFrom)

      expect(result).not.toBeNull()
      expect(getCancelSingleParams).toHaveBeenCalledWith(mockNonce)
    })

    it('should return null when getCancelMultipleParams returns empty array', async () => {
      const getCancelMultipleParamsMock = getCancelMultipleParams as jest.Mock
      getCancelMultipleParamsMock.mockReturnValue([])

      const result = await buildBatchCancellation(mockOrders, mockFrom)
      expect(result).toBeNull()
    })

    it('should return null when getCancelMultipleParams first param is undefined', async () => {
      const getCancelMultipleParamsMock = getCancelMultipleParams as jest.Mock
      getCancelMultipleParamsMock.mockReturnValue([undefined])

      const result = await buildBatchCancellation(mockOrders, mockFrom)
      expect(result).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should handle permit2 contract creation failure', async () => {
      const mockCreatePermit2Contract = createPermit2Contract as jest.Mock
      mockCreatePermit2Contract.mockImplementation(() => {
        throw new Error('Contract creation failed')
      })

      const mockOrder: OrderCancellationParams = {
        encodedOrder: '0xencodedorder',
        routing: TradingApi.Routing.DUTCH_V2,
        chainId,
        orderHash: '0xhash',
      }

      const result = await buildSingleCancellation(mockOrder, mockFrom)
      expect(result).toBeNull()
    })

    it('should handle populateTransaction failure', async () => {
      mockPermit2.populateTransaction.invalidateUnorderedNonces.mockRejectedValue(new Error('Transaction failed'))

      const mockOrder: OrderCancellationParams = {
        encodedOrder: '0xencodedorder',
        routing: TradingApi.Routing.DUTCH_V2,
        chainId,
        orderHash: '0xhash',
      }

      const result = await buildSingleCancellation(mockOrder, mockFrom)
      expect(result).toBeNull()
    })
  })
})
