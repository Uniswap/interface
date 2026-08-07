import { TradingApi } from '@universe/api'
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
  isLimitCancellable,
  isLimitOrder,
  isUniswapXOrderPending,
} from 'uniswap/src/features/transactions/utils/uniswapX.utils'
import { uniswapXOrderDetails } from 'uniswap/src/test/fixtures'

describe('UniswapX Utils', () => {
  describe('convertOrderTypeToRouting', () => {
    it.each([
      [TradingApi.OrderType.PRIORITY, TradingApi.Routing.PRIORITY],
      [TradingApi.OrderType.DUTCH_V2, TradingApi.Routing.DUTCH_V2],
      [TradingApi.OrderType.DUTCH_V3, TradingApi.Routing.DUTCH_V3],
      [TradingApi.OrderType.DUTCH, TradingApi.Routing.DUTCH_LIMIT],
      [TradingApi.OrderType.DUTCH_LIMIT, TradingApi.Routing.DUTCH_LIMIT],
    ])('should convert %s to %s', (input, expected) => {
      expect(convertOrderTypeToRouting(input)).toBe(expected)
    })
  })

  describe('convertOrderTypeToRouting invalid input', () => {
    it.each([['UNKNOWN' as TradingApi.OrderType, TradingApi.Routing.DUTCH_LIMIT]])(
      'should convert %s to %s',
      (input, expected) => {
        expect(convertOrderTypeToRouting(input)).toBe(expected)
      },
    )
  })

  describe('convertOrderStatusToTransactionStatus', () => {
    it.each([
      [TradingApi.OrderStatus.FILLED, TransactionStatus.Success],
      [TradingApi.OrderStatus.OPEN, TransactionStatus.Pending],
      [TradingApi.OrderStatus.EXPIRED, TransactionStatus.Expired],
      [TradingApi.OrderStatus.ERROR, TransactionStatus.Failed],
      [TradingApi.OrderStatus.CANCELLED, TransactionStatus.Canceled],
      [TradingApi.OrderStatus.INSUFFICIENT_FUNDS, TransactionStatus.InsufficientFunds],
      [TradingApi.OrderStatus.UNVERIFIED, TransactionStatus.Unknown],
    ])('should convert %s to %s', (input, expected) => {
      expect(convertOrderStatusToTransactionStatus(input)).toBe(expected)
    })
  })

  describe('convertOrderStatusToTransactionStatus invalid input', () => {
    it.each([['UNKNOWN_STATUS' as TradingApi.OrderStatus, TransactionStatus.Unknown]])(
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
      routing: TradingApi.Routing.DUTCH_LIMIT,
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
      routing: TradingApi.Routing.DUTCH_V2,
    }

    it('should return true for limit orders', () => {
      expect(isLimitOrder(mockLimitOrder)).toBe(true)
    })

    it('should return false for regular UniswapX orders', () => {
      expect(isLimitOrder(mockRegularUniswapXOrder)).toBe(false)
    })
  })

  // Tripwire: the cancel-flow state machine relies on `Cancelling` staying within the existing
  // status enum (no new TransactionStatus) and on these membership tables. If these fail, the
  // cancel timeout/alert flow needs re-review — do not casually update.
  describe('cancel-flow status membership tripwires', () => {
    it.each([
      [TransactionStatus.Pending, true],
      [TransactionStatus.Cancelling, true],
      [TransactionStatus.InsufficientFunds, true],
      [TransactionStatus.Success, false],
      [TransactionStatus.Canceled, false],
      [TransactionStatus.Expired, false],
    ])('isUniswapXOrderPending(%s) === %s', (status, expected) => {
      expect(isUniswapXOrderPending(uniswapXOrderDetails({ status }))).toBe(expected)
    })

    it.each([
      [TransactionStatus.Pending, true],
      [TransactionStatus.InsufficientFunds, true],
      [TransactionStatus.Cancelling, false],
      [TransactionStatus.Success, false],
      [TransactionStatus.Canceled, false],
    ])('isLimitCancellable(%s) === %s', (status, expected) => {
      expect(isLimitCancellable(uniswapXOrderDetails({ status }))).toBe(expected)
    })
  })
})
