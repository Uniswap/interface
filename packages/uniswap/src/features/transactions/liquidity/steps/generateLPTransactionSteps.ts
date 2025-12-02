import { ADDRESS_ZERO } from '@uniswap/router-sdk'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { createCollectFeesStep } from 'uniswap/src/features/transactions/liquidity/steps/collectFees'
import { orderCollectFeesSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectFeesSteps'
import { orderDecreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/decreaseLiquiditySteps'
import { createDecreasePositionStep } from 'uniswap/src/features/transactions/liquidity/steps/decreasePosition'
import { orderIncreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/increaseLiquiditySteps'
import {
  createCreatePositionAsyncStep,
  createIncreasePositionAsyncStep,
  createIncreasePositionStep,
} from 'uniswap/src/features/transactions/liquidity/steps/increasePosition'
import {
  createMigratePositionAsyncStep,
  createMigratePositionStep,
} from 'uniswap/src/features/transactions/liquidity/steps/migrate'
import { orderMigrateLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/migrationSteps'
import {
  isValidLiquidityTxContext,
  LiquidityTransactionType,
  LiquidityTxAndGasInfo,
} from 'uniswap/src/features/transactions/liquidity/types'
import { createApprovalTransactionStep } from 'uniswap/src/features/transactions/steps/approve'
import { createPermit2SignatureStep } from 'uniswap/src/features/transactions/steps/permit2Signature'
import { createPermit2TransactionStep } from 'uniswap/src/features/transactions/steps/permit2Transaction'
import { createRevocationTransactionStep } from 'uniswap/src/features/transactions/steps/revoke'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'

export function generateLPTransactionSteps(txContext: LiquidityTxAndGasInfo): TransactionStep[] {
  const isValidLP = isValidLiquidityTxContext(txContext)

  if (isValidLP) {
    if (txContext.type === LiquidityTransactionType.Collect) {
      return orderCollectFeesSteps({
        collectFees: createCollectFeesStep(txContext.txRequest),
      })
    }

    const {
      action,
      approveToken0Request,
      approveToken1Request,
      approvePositionTokenRequest,
      token0PermitTransaction,
      token1PermitTransaction,
      positionTokenPermitTransaction,
    } = txContext

    const revokeToken0 = createRevocationTransactionStep(
      txContext.revokeToken0Request,
      action.currency0Amount.currency.wrapped,
    )
    const revokeToken1 = createRevocationTransactionStep(
      txContext.revokeToken1Request,
      action.currency1Amount.currency.wrapped,
    )
    const approvalToken0 = createApprovalTransactionStep({
      txRequest: approveToken0Request,
      amountIn: action.currency0Amount,
    })
    const approvalToken1 = createApprovalTransactionStep({
      txRequest: approveToken1Request,
      amountIn: action.currency1Amount,
    })
    const approvalPositionToken = createApprovalTransactionStep({
      txRequest: approvePositionTokenRequest,
      amountIn: action.liquidityToken ? CurrencyAmount.fromRawAmount(action.liquidityToken, 1) : undefined,
      pair: [action.currency0Amount.currency, action.currency1Amount.currency],
    })

    const token0PermitTransactionStep = createPermit2TransactionStep({
      txRequest: token0PermitTransaction,
      amountIn: action.currency0Amount,
      pair: [action.currency0Amount.currency, action.currency1Amount.currency],
    })

    const token1PermitTransactionStep = createPermit2TransactionStep({
      txRequest: token1PermitTransaction,
      amountIn: action.currency1Amount,
      pair: [action.currency0Amount.currency, action.currency1Amount.currency],
    })

    const positionTokenPermitTransactionStep = createPermit2TransactionStep({
      txRequest: positionTokenPermitTransaction,
      amountIn: action.currency1Amount,
      pair: [action.currency0Amount.currency, action.currency1Amount.currency],
    })

    switch (txContext.type) {
      case 'decrease':
        return orderDecreaseLiquiditySteps({
          approvalPositionToken,
          decreasePosition: createDecreasePositionStep(txContext.txRequest, txContext.sqrtRatioX96),
        })
      case 'migrate':
        if (txContext.unsigned) {
          return orderMigrateLiquiditySteps({
            permit: createPermit2SignatureStep(
              txContext.permit.typedData,
              new Token(1, ADDRESS_ZERO, 1, 'Uniswap V3 Positions NFT-V1', 'Uniswap V3 Positions NFT-V1'),
            ),
            migrate: createMigratePositionAsyncStep(
              txContext.migratePositionRequestArgs,
              txContext.permit.typedData.values.deadline as number,
            ),
            positionTokenPermitTransaction: undefined,
          })
        } else {
          return orderMigrateLiquiditySteps({
            permit: undefined,
            positionTokenPermitTransaction: positionTokenPermitTransactionStep,
            migrate: createMigratePositionStep(txContext.txRequest),
          })
        }
      case 'create':
      case 'increase':
        if (txContext.unsigned) {
          return orderIncreaseLiquiditySteps({
            revokeToken0,
            revokeToken1,
            approvalToken0,
            approvalToken1,
            approvalPositionToken,
            permit: createPermit2SignatureStep(txContext.permit.typedData, action.currency0Amount.currency), // TODO: what about for multiple tokens
            token0PermitTransaction: undefined,
            token1PermitTransaction: undefined,
            increasePosition:
              txContext.type === 'increase'
                ? createIncreasePositionAsyncStep(txContext.increasePositionRequestArgs)
                : createCreatePositionAsyncStep(txContext.createPositionRequestArgs),
          })
        } else {
          return orderIncreaseLiquiditySteps({
            revokeToken0,
            revokeToken1,
            approvalToken0,
            approvalToken1,
            approvalPositionToken,
            permit: undefined,
            token0PermitTransaction: token0PermitTransactionStep,
            token1PermitTransaction: token1PermitTransactionStep,
            increasePosition: createIncreasePositionStep(txContext.txRequest, txContext.sqrtRatioX96),
          })
        }
    }
  }

  return []
}
