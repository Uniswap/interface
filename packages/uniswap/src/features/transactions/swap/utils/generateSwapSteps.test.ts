import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { Routing, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import {
  SwapTxAndGasInfo,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { TransactionStepType, generateSwapSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapSteps'
import {
  createMockCurrencyAmount,
  createMockTradeWithStatus,
  createMockUniswapXQuote,
  createMockUniswapXTrade,
} from 'uniswap/src/test/fixtures/transactions/swap'

const mockTrade = createMockTradeWithStatus(
  createMockCurrencyAmount(USDC, '1000000000000000000'),
  createMockCurrencyAmount(WBTC, '1000000000000000000'),
)

const mockUniswapXTrade = createMockUniswapXTrade(USDC, WBTC)

const mockTxRequest = {
  chainId: 1,
  data: '0x000',
  from: '0x123',
  to: '0x456',
  value: '0x00',
}

const baseSwapTxContext: SwapTxAndGasInfo = {
  approveTxRequest: undefined,
  revocationTxRequest: undefined,
  approvalError: false,
  gasFee: { error: null, isLoading: false, value: '1000000000000000000' },
  gasFeeEstimation: { swapEstimates: undefined, approvalEstimates: undefined },
  indicativeTrade: undefined,
  permitData: null,
  permitDataLoading: false,
  permitSignature: undefined,
  routing: Routing.CLASSIC,
  swapRequestArgs: {
    permitData: undefined,
    quote: { tradeType: TradeType.EXACT_INPUT },
    refreshGasPrice: true,
    signature: undefined,
    simulateTransaction: true,
  },
  trade: mockTrade.trade as ClassicTrade,
  txRequest: mockTxRequest,
}

describe('generateSwapSteps', () => {
  describe(Routing.CLASSIC, () => {
    it('should return steps for classic trade with txRequest', () => {
      expect(generateSwapSteps(baseSwapTxContext)).toEqual([
        {
          txRequest: baseSwapTxContext.txRequest,
          type: TransactionStepType.SwapTransaction,
        },
      ])
    })

    it('should return steps for classic trade with revocation and approval required', () => {
      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockTxRequest,
        revocationTxRequest: mockTxRequest,
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.revocationTxRequest,
          token: USDC,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          txRequest: swapTxContext.txRequest,
          type: 'SwapTransaction',
        },
      ])
    })

    it('should return steps for classic trade with approval required', () => {
      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockTxRequest,
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          txRequest: swapTxContext.txRequest,
          type: 'SwapTransaction',
        },
      ])
    })

    it('should return steps for classic trade with approval and permit required', () => {
      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockTxRequest,
        permitData: {
          domain: {
            name: 'Uniswap',
            version: '1.0',
            chainId: 1,
            verifyingContract: '0x123',
          },
        },
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permitData,
          types: undefined,
          value: undefined,
          token: USDC,
          type: TransactionStepType.Permit2Signature,
        },
        {
          getTxRequest: expect.any(Function),
          type: TransactionStepType.SwapTransactionAsync,
        },
      ])
    })
  })

  describe(Routing.DUTCH_V2, () => {
    it('should return steps for uniswapx trade', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: Routing.DUTCH_V2,
        orderParams: {
          quote: createMockUniswapXQuote(USDC.address),
          signature: '0x000',
        },
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permitData: {
          domain: {
            name: 'Uniswap',
            version: '1.0',
            chainId: 1,
            verifyingContract: '0x123',
          },
          types: undefined,
          value: undefined,
        },
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          native: USDC,
        },
        {
          ...swapTxContext.permitData,
          type: TransactionStepType.UniswapXSignature,
        },
      ])
    })

    it('should return steps for uniswapx trade with revocation and approval required', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: Routing.DUTCH_V2,
        orderParams: {
          quote: createMockUniswapXQuote(USDC.address),
          signature: '0x000',
        },
        approveTxRequest: mockTxRequest,
        revocationTxRequest: mockTxRequest,
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permitData: {
          domain: {
            name: 'Uniswap',
            version: '1.0',
            chainId: 1,
            verifyingContract: '0x123',
          },
          types: undefined,
          value: undefined,
        },
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          native: USDC,
        },
        {
          txRequest: swapTxContext.revocationTxRequest,
          token: USDC,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permitData,
          type: TransactionStepType.UniswapXSignature,
        },
      ])
    })

    it('should return steps for uniswapx trade with approval required', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: Routing.DUTCH_V2,
        orderParams: {
          quote: createMockUniswapXQuote(USDC.address),
          signature: '0x000',
        },
        approveTxRequest: mockTxRequest,
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permitData: {
          domain: {
            name: 'Uniswap',
            version: '1.0',
            chainId: 1,
            verifyingContract: '0x123',
          },
          types: undefined,
          value: undefined,
        },
      }

      expect(generateSwapSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          native: USDC,
        },
        {
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permitData,
          type: TransactionStepType.UniswapXSignature,
        },
      ])
    })
  })
})
