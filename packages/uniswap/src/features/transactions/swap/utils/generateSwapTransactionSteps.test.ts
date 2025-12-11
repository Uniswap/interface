import { TradingApi } from '@universe/api'
import { USDC, WBTC } from 'uniswap/src/constants/tokens'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import {
  SwapTxAndGasInfo,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { generateSwapTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateSwapTransactionSteps'
import { mockPermit } from 'uniswap/src/test/fixtures/permit'
import {
  createMockCurrencyAmount,
  createMockTradeWithStatus,
  createMockUniswapXTrade,
} from 'uniswap/src/test/fixtures/transactions/swap'

const UserAgentMock = jest.requireMock('utilities/src/platform')
jest.mock('utilities/src/platform', () => ({
  ...jest.requireActual('utilities/src/platform'),
}))

const mockTxRequest = {
  chainId: 1,
  data: '0x000',
  from: '0x123',
  to: '0x456',
  value: '0x00',
}

const mockApproveRequest = {
  ...mockTxRequest,
  data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba3ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
}
const mockRevokeRequest = {
  ...mockTxRequest,
  data: '0x095ea7b3000000000000000000000000000000000022d473030f116ddee9f6b43ac78ba30000000000000000000000000000000000000000000000000000000000000000',
}

describe('Swap', () => {
  const mockTrade = createMockTradeWithStatus(
    createMockCurrencyAmount(USDC, '1000000000000000000'),
    createMockCurrencyAmount(WBTC, '1000000000000000000'),
  )

  const mockUniswapXTrade = createMockUniswapXTrade(USDC, WBTC)

  const baseSwapTxContext = {
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: { error: null, isLoading: false, value: '1000000000000000000' },
    gasFeeEstimation: { swapEstimate: undefined, approvalEstimate: undefined },
    permit: undefined,
    routing: TradingApi.Routing.CLASSIC,
    swapRequestArgs: {
      permitData: undefined,
      quote: { tradeType: TradingApi.TradeType.EXACT_INPUT },
      refreshGasPrice: true,
      signature: undefined,
      simulateTransaction: true,
    },
    trade: mockTrade.trade as ClassicTrade,
    txRequests: [mockTxRequest],
    unsigned: false,
    includesDelegation: false,
  } as const satisfies SwapTxAndGasInfo

  describe(TradingApi.Routing.CLASSIC, () => {
    it('should return steps for classic trade with txRequest', () => {
      expect(generateSwapTransactionSteps(baseSwapTxContext)).toEqual([
        {
          txRequest: baseSwapTxContext.txRequests[0],
          type: TransactionStepType.SwapTransaction,
        },
      ])
    })

    it('should return steps for classic trade with revocation and approval required', () => {
      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockApproveRequest,
        revocationTxRequest: mockRevokeRequest,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          amount: '0',
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.revocationTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          txRequest: swapTxContext.txRequests[0],
          type: 'SwapTransaction',
        },
      ])
    })

    it('should return steps for classic trade with approval required', () => {
      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockApproveRequest,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          txRequest: swapTxContext.txRequests[0],
          type: 'SwapTransaction',
        },
      ])
    })

    it('should return steps for classic trade with approval and permit required', () => {
      // We only expect `SwapTransactionAsync` step when on interface swap (unsigned w/o a wallet interaction)
      UserAgentMock.isWebApp = true

      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockApproveRequest,
        unsigned: true,
        permit: mockPermit,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit.typedData,
          type: TransactionStepType.Permit2Signature,
        },
        {
          getTxRequest: expect.any(Function),
          type: TransactionStepType.SwapTransactionAsync,
        },
      ])
    })
  })

  describe(TradingApi.Routing.DUTCH_V2, () => {
    it('should return steps for uniswapx trade', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: TradingApi.Routing.DUTCH_V2,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
        },
        permit: mockPermit,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          ...swapTxContext.permit?.typedData,
          type: TransactionStepType.UniswapXSignature,
          quote: swapTxContext.trade.quote.quote,
          deadline: mockUniswapXTrade.quote.quote.orderInfo.deadline,
        },
      ])
    })

    it('should return steps for uniswapx trade with revocation and approval required', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: TradingApi.Routing.DUTCH_V2,
        approveTxRequest: mockApproveRequest,
        revocationTxRequest: mockRevokeRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
        },
        permit: mockPermit,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          amount: '0',
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.revocationTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          amount: mockUniswapXTrade.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit?.typedData,
          type: TransactionStepType.UniswapXSignature,
          quote: swapTxContext.trade.quote.quote,
          deadline: mockUniswapXTrade.quote.quote.orderInfo.deadline,
        },
      ])
    })

    it('should return steps for uniswapx trade with approval required', () => {
      const swapTxContext: UniswapXSwapTxAndGasInfo = {
        ...baseSwapTxContext,
        trade: mockUniswapXTrade,
        routing: TradingApi.Routing.DUTCH_V2,
        approveTxRequest: mockApproveRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
        },
        permit: mockPermit,
      }

      expect(generateSwapTransactionSteps(swapTxContext)).toEqual([
        {
          amount: mockUniswapXTrade.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          chainId: USDC.chainId,
          tokenAddress: USDC.address,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit?.typedData,
          type: TransactionStepType.UniswapXSignature,
          quote: swapTxContext.trade.quote.quote,
          deadline: mockUniswapXTrade.quote.quote.orderInfo.deadline,
        },
      ])
    })
  })
})
