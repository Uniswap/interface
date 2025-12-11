import { CurrencyAmount } from '@uniswap/sdk-core'
import { createCollectFeesStep } from 'uniswap/src/features/transactions/liquidity/steps/collectFees'
import { orderCollectFeesSteps } from 'uniswap/src/features/transactions/liquidity/steps/collectFeesSteps'
import { orderDecreaseLiquiditySteps } from 'uniswap/src/features/transactions/liquidity/steps/decreaseLiquiditySteps'
import { createDecreasePositionStep } from 'uniswap/src/features/transactions/liquidity/steps/decreasePosition'
import {
  IncreaseLiquiditySteps,
  orderIncreaseLiquiditySteps,
} from 'uniswap/src/features/transactions/liquidity/steps/increaseLiquiditySteps'
import {
  createCreatePositionAsyncStep,
  createIncreasePositionAsyncStep,
  createIncreasePositionStep,
  createIncreasePositionStepBatched,
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
import { OnChainTransactionFields, TransactionStep } from 'uniswap/src/features/transactions/steps/types'

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

    const token0Fields = {
      txRequest: txContext.revokeToken0Request,
      tokenAddress: action.currency0Amount.currency.wrapped.address,
      chainId: action.currency0Amount.currency.chainId,
      amount: action.currency0Amount.quotient.toString(),
    }

    const token1Fields = {
      txRequest: txContext.revokeToken1Request,
      tokenAddress: action.currency1Amount.currency.wrapped.address,
      chainId: action.currency1Amount.currency.chainId,
      amount: action.currency1Amount.quotient.toString(),
    }

    const revokeToken0 = createRevocationTransactionStep({
      ...token0Fields,
      txRequest: txContext.revokeToken0Request,
    })
    const revokeToken1 = createRevocationTransactionStep({
      ...token1Fields,
      txRequest: txContext.revokeToken1Request,
    })
    const approvalToken0 = createApprovalTransactionStep({
      ...token0Fields,
      txRequest: approveToken0Request,
    })
    const approvalToken1 = createApprovalTransactionStep({
      ...token1Fields,
      txRequest: approveToken1Request,
    })

    const approvalPositionToken = createApprovalTransactionStep({
      amount: action.liquidityToken ? CurrencyAmount.fromRawAmount(action.liquidityToken, 1).quotient.toString() : '0',
      tokenAddress: action.liquidityToken?.wrapped.address,
      chainId: action.liquidityToken?.chainId,
      txRequest: approvePositionTokenRequest,
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
            permit: createPermit2SignatureStep(txContext.permit.typedData),
            migrate: createMigratePositionAsyncStep(
              txContext.migratePositionRequestArgs,
              txContext.permit.typedData.values.deadline as number,
            ),
            positionTokenPermitTransaction: undefined,
            approvalPositionToken: undefined,
          })
        } else {
          return orderMigrateLiquiditySteps({
            permit: undefined,
            positionTokenPermitTransaction: positionTokenPermitTransactionStep,
            approvalPositionToken,
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
            permit: createPermit2SignatureStep(txContext.permit.typedData),
            token0PermitTransaction: undefined,
            token1PermitTransaction: undefined,
            increasePosition:
              txContext.type === 'increase'
                ? createIncreasePositionAsyncStep(txContext.increasePositionRequestArgs)
                : createCreatePositionAsyncStep(txContext.createPositionRequestArgs),
          })
        } else {
          const steps = orderIncreaseLiquiditySteps({
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

          if (txContext.canBatchTransactions) {
            // Use batched step - all transactions (approvals, permits, revokes, main) are in the array
            const txRequests = steps
              .filter((step): step is IncreaseLiquiditySteps & OnChainTransactionFields => 'txRequest' in step)
              .map((step) => step.txRequest)
            return [createIncreasePositionStepBatched(txRequests, txContext.sqrtRatioX96)]
          }

          return steps
        }
    }
  }

  return []
}
