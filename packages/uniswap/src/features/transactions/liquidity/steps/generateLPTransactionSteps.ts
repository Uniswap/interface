import { CurrencyAmount } from '@uniswap/sdk-core'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
import { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

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
        // For HashKey chains, we use async steps even if unsigned is false
        // because we don't have txRequest from Trading API
        const createPositionRequestArgs = txContext.type === 'create' ? txContext.createPositionRequestArgs : undefined
        const chainIdNum = createPositionRequestArgs?.chainId ? Number(createPositionRequestArgs.chainId) : undefined
        const isHashKeyChain =
          chainIdNum === UniverseChainId.HashKey || chainIdNum === UniverseChainId.HashKeyTestnet
        
        // Use async step if unsigned OR if HashKey chain without txRequest
        const unsigned = 'unsigned' in txContext ? txContext.unsigned : false
        const shouldUseAsyncStep = unsigned || (isHashKeyChain && !txContext.txRequest && createPositionRequestArgs)
        
        if (shouldUseAsyncStep) {
          // For HashKey chains without permit, we still use async step but without permit signature
          const permit = 'permit' in txContext ? txContext.permit : undefined
          
          if (txContext.type === 'create') {
            // If we have permit, use the first flow type, otherwise use the third flow type (no permit, async step)
            if (permit) {
              const permitStep = createPermit2SignatureStep(permit.typedData)
              return orderIncreaseLiquiditySteps({
                revokeToken0,
                revokeToken1,
                approvalToken0,
                approvalToken1,
                approvalPositionToken,
                permit: permitStep,
                token0PermitTransaction: undefined,
                token1PermitTransaction: undefined,
                increasePosition: createCreatePositionAsyncStep(createPositionRequestArgs),
              })
            } else {
              return orderIncreaseLiquiditySteps({
                revokeToken0,
                revokeToken1,
                approvalToken0,
                approvalToken1,
                approvalPositionToken,
                permit: undefined,
                token0PermitTransaction: undefined,
                token1PermitTransaction: undefined,
                increasePosition: createCreatePositionAsyncStep(createPositionRequestArgs),
              })
            }
          } else {
            const increasePositionRequestArgs = 'increasePositionRequestArgs' in txContext ? txContext.increasePositionRequestArgs : undefined
            if (permit) {
              const permitStep = createPermit2SignatureStep(permit.typedData)
              return orderIncreaseLiquiditySteps({
                revokeToken0,
                revokeToken1,
                approvalToken0,
                approvalToken1,
                approvalPositionToken,
                permit: permitStep,
                token0PermitTransaction: undefined,
                token1PermitTransaction: undefined,
                increasePosition: createIncreasePositionAsyncStep(increasePositionRequestArgs),
              })
            } else {
              return orderIncreaseLiquiditySteps({
                revokeToken0,
                revokeToken1,
                approvalToken0,
                approvalToken1,
                approvalPositionToken,
                permit: undefined,
                token0PermitTransaction: undefined,
                token1PermitTransaction: undefined,
                increasePosition: createIncreasePositionAsyncStep(increasePositionRequestArgs),
              })
            }
          }
        } else {
          if (!txContext.txRequest) {
            return []
          }
          const txRequest = txContext.txRequest as ValidatedTransactionRequest
          const steps = orderIncreaseLiquiditySteps({
            revokeToken0,
            revokeToken1,
            approvalToken0,
            approvalToken1,
            approvalPositionToken,
            permit: undefined,
            token0PermitTransaction: token0PermitTransactionStep,
            token1PermitTransaction: token1PermitTransactionStep,
            increasePosition: createIncreasePositionStep(txRequest, txContext.sqrtRatioX96),
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
