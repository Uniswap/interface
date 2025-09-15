import { OrderStatus, OrderType, Routing } from 'uniswap/src/data/tradingApi/__generated__/index'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  convertOrderStatusToTransactionStatus,
  convertOrderTypeToRouting,
  isLimitOrder,
} from 'uniswap/src/features/transactions/utils/uniswapX.utils'

describe('UniswapX Utils', () => {
  describe('convertOrderTypeToRouting', () => {
    it.each([
      [OrderType.PRIORITY, Routing.PRIORITY],
      [OrderType.DUTCH_V2, Routing.DUTCH_V2],
      [OrderType.DUTCH_V3, Routing.DUTCH_V3],
      [OrderType.DUTCH, Routing.DUTCH_LIMIT],
      [OrderType.DUTCH_LIMIT, Routing.DUTCH_LIMIT],
    ])('should convert %s to %s', (input, expected) => {
      expect(convertOrderTypeToRouting(input)).toBe(expected)
    })
  })

  describe('convertOrderTypeToRouting invalid input', () => {
    it.each([['UNKNOWN' as OrderType, Routing.DUTCH_LIMIT]])('should convert %s to %s', (input, expected) => {
      expect(convertOrderTypeToRouting(input)).toBe(expected)
    })
  })

  describe('convertOrderStatusToTransactionStatus', () => {
    it.each([
      [OrderStatus.FILLED, TransactionStatus.Success],
      [OrderStatus.OPEN, TransactionStatus.Pending],
      [OrderStatus.EXPIRED, TransactionStatus.Expired],
      [OrderStatus.ERROR, TransactionStatus.Failed],
      [OrderStatus.CANCELLED, TransactionStatus.Canceled],
      [OrderStatus.INSUFFICIENT_FUNDS, TransactionStatus.InsufficientFunds],
      [OrderStatus.UNVERIFIED, TransactionStatus.Unknown],
    ])('should convert %s to %s', (input, expected) => {
      expect(convertOrderStatusToTransactionStatus(input)).toBe(expected)
    })
  })

  describe('convertOrderStatusToTransactionStatus invalid input', () => {
    it.each([['UNKNOWN_STATUS' as OrderStatus, TransactionStatus.Unknown]])(
      'should convert %s to %s',
      (input, expected) => {
        expect(convertOrderStatusToTransactionStatus(input)).toBe(expected)
      },
    )
  })

  describe('isLimitOrder', () => {
    const mockLimitOrder: UniswapXOrderDetails = {
      id: 'test-limit-order',
      chainId: UniverseChainId.Mainnet,
      routing: Routing.DUTCH_LIMIT,
      orderHash: '0x123',
      from: '0xabc',
      status: TransactionStatus.Pending,
      addedTime: Date.now(),
      transactionOriginType: TransactionOriginType.External,
      typeInfo: {
        type: TransactionType.Swap,
        inputCurrencyId: 'ETH',
        outputCurrencyId: 'USDC',
        inputCurrencyAmountRaw: '1000000000000000000',
        expectedOutputCurrencyAmountRaw: '1000000',
        minimumOutputCurrencyAmountRaw: '990000',
        tradeType: 0,
        isUniswapXOrder: true,
      },
    }

    const mockRegularUniswapXOrder: UniswapXOrderDetails = {
      ...mockLimitOrder,
      routing: Routing.DUTCH_V2,
    }

    it('should return true for limit orders', () => {
      expect(isLimitOrder(mockLimitOrder)).toBe(true)
    })

    it('should return false for regular UniswapX orders', () => {
      expect(isLimitOrder(mockRegularUniswapXOrder)).toBe(false)
    })
  })
})
