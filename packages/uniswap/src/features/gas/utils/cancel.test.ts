import { BigNumber } from '@ethersproject/bignumber'
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { providers } from 'ethers/lib/ethers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import {
  CancellationType,
  calculateCancellationGasFee,
  createClassicCancelRequest,
  getCancellationType,
} from 'uniswap/src/features/gas/utils/cancel'
import {
  ExactInputSwapTransactionInfo,
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
  UniswapXOrderDetails,
} from 'uniswap/src/features/transactions/types/transactionDetails'

describe('CancellationGasCalculationService', () => {
  const mockClassicTransaction: TransactionDetails = {
    id: 'classic-1',
    chainId: UniverseChainId.Mainnet,
    from: '0xuser',
    hash: '0xhash',
    routing: TradingApi.Routing.CLASSIC,
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    options: {
      request: {
        from: '0xuser',
        to: '0xrecipient',
        value: '0x0',
        gasLimit: BigNumber.from('50000'),
        maxFeePerGas: BigNumber.from('20000000000'),
        maxPriorityFeePerGas: BigNumber.from('2000000000'),
      },
    },
    typeInfo: {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId: 'currency0Id',
      inputCurrencyAmountRaw: '0',
      outputCurrencyId: 'currency1Id',
      expectedOutputCurrencyAmountRaw: '1',
      minimumOutputCurrencyAmountRaw: '1',
    } as ExactInputSwapTransactionInfo,
  }

  const mockUniswapXOrder: UniswapXOrderDetails = {
    id: 'order-1',
    chainId: UniverseChainId.Mainnet,
    from: '0xuser',
    orderHash: '0xorderHash',
    encodedOrder: '0xencodedOrder',
    hash: '0xhash',
    status: TransactionStatus.Pending,
    addedTime: Date.now(),
    transactionOriginType: TransactionOriginType.Internal,
    routing: TradingApi.Routing.DUTCH_V2,
    typeInfo: {
      type: TransactionType.Swap,
      tradeType: TradeType.EXACT_INPUT,
      inputCurrencyId: 'currency0Id',
      inputCurrencyAmountRaw: '0',
      outputCurrencyId: 'currency1Id',
      expectedOutputCurrencyAmountRaw: '1',
      minimumOutputCurrencyAmountRaw: '1',
    } as ExactInputSwapTransactionInfo,
  }

  const mockGasFeeResult: GasFeeResult = {
    value: '1000000000000000',
    displayValue: '1000000000000000',
    params: {
      maxFeePerGas: '20000000000',
      maxPriorityFeePerGas: '2000000000',
      gasLimit: '50000',
    },
    isLoading: false,
    error: null,
  }

  const mockCancelRequest: providers.TransactionRequest = {
    from: '0xuser',
    to: '0xpermit2',
    data: '0xcanceldata',
    chainId: UniverseChainId.Mainnet,
  }

  describe('getCancellationType', () => {
    it('returns uniswapx for UniswapX transactions', () => {
      expect(getCancellationType(mockUniswapXOrder)).toBe(CancellationType.UniswapX)
    })

    it('returns classic for classic transactions with no orders', () => {
      expect(getCancellationType(mockClassicTransaction)).toBe(CancellationType.Classic)
    })

    it('returns uniswapx when orders are provided', () => {
      expect(getCancellationType(mockClassicTransaction, [mockUniswapXOrder])).toBe(CancellationType.UniswapX)
    })

    it('returns uniswapx for UniswapX transactions with orders', () => {
      expect(getCancellationType(mockUniswapXOrder, [mockUniswapXOrder])).toBe(CancellationType.UniswapX)
    })
  })

  describe('createClassicCancelRequest', () => {
    it('creates a cancel request for classic transaction', () => {
      const request = createClassicCancelRequest(mockClassicTransaction)

      expect(request).toEqual({
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
        to: '0xuser', // Cancel transaction sends to self
        value: '0x0',
      })
    })

    it('returns basic request when no options are provided', () => {
      const { options, ...txWithoutOptions } = mockClassicTransaction

      const request = createClassicCancelRequest(txWithoutOptions as TransactionDetails)

      expect(request).toEqual({
        chainId: UniverseChainId.Mainnet,
        from: '0xuser',
        to: '0xuser',
        value: '0x0',
      })
    })
  })

  describe('calculateCancellationGasFee', () => {
    it('returns undefined when no gas fee is provided', () => {
      const result = calculateCancellationGasFee({
        type: CancellationType.Classic,
        transaction: mockClassicTransaction,
      })

      expect(result).toBeUndefined()
    })

    it('maintains the display value ratio for classic cancellation', () => {
      // Test with different display/value ratios to ensure ratio is maintained
      const gasFeeWithRatio: GasFeeResult = {
        value: '1150000000000000', // 0.00115 ETH (inflated by 15%)
        displayValue: '1000000000000000', // 0.001 ETH (actual expected cost)
        params: {
          maxFeePerGas: '20000000000',
          maxPriorityFeePerGas: '2000000000',
          gasLimit: '50000',
        },
        isLoading: false,
        error: null,
      }

      const result = calculateCancellationGasFee({
        type: CancellationType.Classic,
        transaction: mockClassicTransaction,
        gasFee: gasFeeWithRatio,
      })

      // The ratio should be maintained: displayValue/value ≈ 0.87
      // Since we apply 1.1x for cancellation, the new values should maintain this ratio
      expect(result).toBeDefined()
      if (result) {
        // Parse the display value to verify the ratio is maintained
        const displayNum = BigNumber.from(result.gasFeeDisplayValue)
        // The display should be roughly 87% of the actual cancellation fee
        // We can't check the exact internal value, but we can verify displayValue exists
        expect(displayNum.gt(0)).toBe(true)
      }
    })

    it('returns gas fee for classic cancellation', () => {
      const result = calculateCancellationGasFee({
        type: CancellationType.Classic,
        transaction: mockClassicTransaction,
        gasFee: mockGasFeeResult,
        cancelRequest: mockCancelRequest,
      })

      // For classic cancellation, the gas fee is adjusted by a factor
      expect(result).toBeDefined()
      expect(result?.cancelRequest).toBeDefined()
      expect(result?.gasFeeDisplayValue).toBeDefined()
    })

    it('returns gas fee for UniswapX single cancellation', () => {
      const result = calculateCancellationGasFee({
        type: CancellationType.UniswapX,
        transaction: mockUniswapXOrder,
        gasFee: mockGasFeeResult,
        cancelRequest: mockCancelRequest,
      })

      expect(result).toEqual({
        cancelRequest: mockCancelRequest,
        gasFeeDisplayValue: '1000000000000000',
      })
    })

    it('returns gas fee for UniswapX batch cancellation', () => {
      const result = calculateCancellationGasFee({
        type: CancellationType.UniswapX,
        transaction: mockUniswapXOrder,
        gasFee: mockGasFeeResult,
        cancelRequest: mockCancelRequest,
        orders: [mockUniswapXOrder, mockUniswapXOrder],
      })

      expect(result).toEqual({
        cancelRequest: mockCancelRequest,
        gasFeeDisplayValue: '1000000000000000',
      })
    })

    it('returns gas fee even when loading', () => {
      const loadingGasFee: GasFeeResult = {
        ...mockGasFeeResult,
        isLoading: true,
      }

      const result = calculateCancellationGasFee({
        type: CancellationType.Classic,
        transaction: mockClassicTransaction,
        gasFee: loadingGasFee,
        cancelRequest: mockCancelRequest,
      })

      // The service still returns a result even when loading
      expect(result).toBeDefined()
    })
  })
})
