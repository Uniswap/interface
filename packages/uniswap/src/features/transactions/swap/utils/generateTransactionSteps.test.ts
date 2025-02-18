import { USDC, USDT, WBTC } from 'uniswap/src/constants/tokens'
import { IndependentToken, ProtocolItems, Routing, TradeType } from 'uniswap/src/data/tradingApi/__generated__'
import {
  IncreasePositionTxAndGasInfo,
  LiquidityTransactionType,
  LiquidityTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/types/steps'
import {
  SwapTxAndGasInfo,
  UniswapXSwapTxAndGasInfo,
} from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { ClassicTrade } from 'uniswap/src/features/transactions/swap/types/trade'
import { generateTransactionSteps } from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'
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

  const baseSwapTxContext: SwapTxAndGasInfo = {
    approveTxRequest: undefined,
    revocationTxRequest: undefined,
    gasFee: { error: null, isLoading: false, value: '1000000000000000000' },
    gasFeeEstimation: { swapEstimates: undefined, approvalEstimates: undefined },
    indicativeTrade: undefined,
    permit: undefined,
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
    unsigned: false,
  }

  describe(Routing.CLASSIC, () => {
    it('should return steps for classic trade with txRequest', () => {
      expect(generateTransactionSteps(baseSwapTxContext)).toEqual([
        {
          txRequest: baseSwapTxContext.txRequest,
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

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          amount: '0',
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.revocationTxRequest,
          token: USDC,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
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
        approveTxRequest: mockApproveRequest,
      }

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
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
      // We only expect `SwapTransactionAsync` step when on interface swap (unsigned w/o a wallet interaction)
      UserAgentMock.isInterface = true

      const swapTxContext = {
        ...baseSwapTxContext,
        approveTxRequest: mockApproveRequest,
        unsigned: true,
        permit: mockPermit,
      }

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          amount: mockTrade.trade?.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit,
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
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permit: mockPermit,
      }

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          amount: mockUniswapXTrade.inputAmount,
        },
        {
          ...swapTxContext.permit,
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
        routing: Routing.DUTCH_V2,
        approveTxRequest: mockApproveRequest,
        revocationTxRequest: mockRevokeRequest,
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permit: mockPermit,
      }

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          amount: mockUniswapXTrade.inputAmount,
        },
        {
          amount: '0',
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.revocationTxRequest,
          token: USDC,
          type: TransactionStepType.TokenRevocationTransaction,
        },
        {
          amount: mockUniswapXTrade.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit,
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
        routing: Routing.DUTCH_V2,
        approveTxRequest: mockApproveRequest,
        wrapTxRequest: mockTxRequest,
        gasFeeBreakdown: {
          approvalCost: '1000000000000000000',
          classicGasUseEstimateUSD: '1000000000000000000',
          inputTokenSymbol: 'USDC',
          wrapCost: '1000000000000000000',
        },
        permit: mockPermit,
      }

      expect(generateTransactionSteps(swapTxContext)).toEqual([
        {
          txRequest: swapTxContext.wrapTxRequest,
          type: TransactionStepType.WrapTransaction,
          amount: mockUniswapXTrade.inputAmount,
        },
        {
          amount: mockUniswapXTrade.inputAmount.quotient.toString(),
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          txRequest: swapTxContext.approveTxRequest,
          token: USDC,
          type: TransactionStepType.TokenApprovalTransaction,
        },
        {
          ...swapTxContext.permit,
          type: TransactionStepType.UniswapXSignature,
          quote: swapTxContext.trade.quote.quote,
          deadline: mockUniswapXTrade.quote.quote.orderInfo.deadline,
        },
      ])
    })
  })
})

describe('Liquidity', () => {
  const baseLiquidityTxContext: LiquidityTxAndGasInfo = {
    type: LiquidityTransactionType.Increase,
    protocolVersion: 2,
    action: {
      type: LiquidityTransactionType.Increase,
      currency0Amount: createMockCurrencyAmount(USDC, '1000000'),
      currency1Amount: createMockCurrencyAmount(USDT, '1000000'),
    },
    increasePositionRequestArgs: {
      simulateTransaction: true,
      protocol: ProtocolItems.V3,
      tokenId: 1000000,
      walletAddress: '0x18d058a7E0486E632f7DfC473BC76D72CD201cAd',
      chainId: 1,
      independentAmount: '1000000',
      independentToken: IndependentToken.TOKEN_1,
      position: {
        tickLower: -887220,
        tickUpper: 887220,
        pool: {
          token0: USDC.address,
          token1: USDT.address,
          fee: 3000,
          tickSpacing: 60,
        },
      },
    },
    txRequest: mockTxRequest,
    unsigned: false,
    approveToken0Request: undefined,
    approveToken1Request: undefined,
    approvePositionTokenRequest: undefined,
    permit: undefined,
    revokeToken0Request: undefined,
    revokeToken1Request: undefined,
  }

  describe(LiquidityTransactionType.Increase, () => {
    it('should return steps for increase liquidity', () => {
      const liquidityTxContext: IncreasePositionTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Increase,
      }

      expect(generateTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.IncreasePositionTransaction,
        },
      ])
    })

    it('should return steps for increase liquidity with approval required', () => {
      const liquidityTxContext: IncreasePositionTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Increase,
        approveToken0Request: mockApproveRequest,
      }

      expect(generateTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.approveToken0Request,
          type: TransactionStepType.TokenApprovalTransaction,
          amount: liquidityTxContext.action.currency0Amount.quotient.toString(),
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.IncreasePositionTransaction,
        },
      ])
    })

    it('should return steps for increase liquidity with approval and revoke required', () => {
      const liquidityTxContext: IncreasePositionTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Increase,
        approveToken0Request: mockApproveRequest,
        revokeToken0Request: mockRevokeRequest,
      }

      expect(generateTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.revokeToken0Request,
          type: TransactionStepType.TokenRevocationTransaction,
          amount: '0',
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.approveToken0Request,
          type: TransactionStepType.TokenApprovalTransaction,
          amount: liquidityTxContext.action.currency0Amount.quotient.toString(),
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.IncreasePositionTransaction,
        },
      ])
    })

    it('should return steps for 2 approvals and 2 revocations', () => {
      const liquidityTxContext: IncreasePositionTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Increase,
        approveToken0Request: mockApproveRequest,
        approveToken1Request: mockApproveRequest,
        revokeToken0Request: mockRevokeRequest,
        revokeToken1Request: mockRevokeRequest,
      }

      expect(generateTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.revokeToken0Request,
          type: TransactionStepType.TokenRevocationTransaction,
          amount: '0',
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.revokeToken1Request,
          type: TransactionStepType.TokenRevocationTransaction,
          amount: '0',
          token: liquidityTxContext.action.currency1Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.approveToken0Request,
          type: TransactionStepType.TokenApprovalTransaction,
          amount: liquidityTxContext.action.currency0Amount.quotient.toString(),
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.approveToken1Request,
          type: TransactionStepType.TokenApprovalTransaction,
          amount: liquidityTxContext.action.currency1Amount.quotient.toString(),
          token: liquidityTxContext.action.currency1Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.IncreasePositionTransaction,
        },
      ])
    })
  })

  describe(LiquidityTransactionType.Decrease, () => {
    it('should return steps for decrease liquidity', () => {
      const liquidityTxContext: LiquidityTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Decrease,
      }

      expect(generateTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.DecreasePositionTransaction,
        },
      ])
    })
  })
})
