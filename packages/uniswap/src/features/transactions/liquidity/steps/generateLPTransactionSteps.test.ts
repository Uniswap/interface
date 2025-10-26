import { TradingApi } from '@universe/api'
import { DEFAULT_TICK_SPACING } from 'uniswap/src/constants/pools'
import { USDC, USDT } from 'uniswap/src/constants/tokens'
import { generateLPTransactionSteps } from 'uniswap/src/features/transactions/liquidity/steps/generateLPTransactionSteps'
import {
  IncreasePositionTxAndGasInfo,
  LiquidityTransactionType,
  LiquidityTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { createMockCurrencyAmount } from 'uniswap/src/test/fixtures/transactions/swap'

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
      protocol: TradingApi.ProtocolItems.V3,
      tokenId: 1000000,
      walletAddress: '0x18d058a7E0486E632f7DfC473BC76D72CD201cAd',
      chainId: 1,
      independentAmount: '1000000',
      independentToken: TradingApi.IndependentToken.TOKEN_1,
      position: {
        tickLower: -887220,
        tickUpper: 887220,
        pool: {
          token0: USDC.address,
          token1: USDT.address,
          fee: 3000,
          tickSpacing: DEFAULT_TICK_SPACING,
        },
      },
    },
    txRequest: mockTxRequest,
    sqrtRatioX96: '1000000000000000000',
    unsigned: false,
    approveToken0Request: undefined,
    approveToken1Request: undefined,
    approvePositionTokenRequest: undefined,
    permit: undefined,
    revokeToken0Request: undefined,
    revokeToken1Request: undefined,
    token0PermitTransaction: undefined,
    token1PermitTransaction: undefined,
    positionTokenPermitTransaction: undefined,
  }

  describe(LiquidityTransactionType.Increase, () => {
    it('should return steps for increase liquidity', () => {
      const liquidityTxContext: IncreasePositionTxAndGasInfo = {
        ...baseLiquidityTxContext,
        type: LiquidityTransactionType.Increase,
      }

      expect(generateLPTransactionSteps(liquidityTxContext)).toEqual([
        {
          sqrtRatioX96: '1000000000000000000',
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

      expect(generateLPTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.approveToken0Request,
          type: TransactionStepType.TokenApprovalTransaction,
          amount: liquidityTxContext.action.currency0Amount.quotient.toString(),
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
          pair: undefined,
        },
        {
          sqrtRatioX96: '1000000000000000000',
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

      expect(generateLPTransactionSteps(liquidityTxContext)).toEqual([
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
          sqrtRatioX96: '1000000000000000000',
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

      expect(generateLPTransactionSteps(liquidityTxContext)).toEqual([
        {
          txRequest: liquidityTxContext.revokeToken0Request,
          type: TransactionStepType.TokenRevocationTransaction,
          amount: '0',
          token: liquidityTxContext.action.currency0Amount.currency,
          spender: '0x000000000022d473030f116ddee9f6b43ac78ba3',
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
          sqrtRatioX96: '1000000000000000000',
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

      expect(generateLPTransactionSteps(liquidityTxContext)).toEqual([
        {
          sqrtRatioX96: '1000000000000000000',
          txRequest: liquidityTxContext.txRequest,
          type: TransactionStepType.DecreasePositionTransaction,
        },
      ])
    })
  })
})
