import { ADDRESS_ZERO } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import {
  createLpPosition,
  fetchSwap,
  increaseLpPosition,
  migrateLpPosition,
} from 'uniswap/src/data/apiClients/tradingApi/TradingApiClient'
import {
  CreateLPPositionRequest,
  CreateSwapRequest,
  DutchQuoteV2,
  DutchQuoteV3,
  IncreaseLPPositionRequest,
  MigrateLPPositionRequest,
  PriorityQuote,
} from 'uniswap/src/data/tradingApi/__generated__'
import {
  LiquidityTransactionType,
  LiquidityTxAndGasInfo,
  isValidLiquidityTxContext,
} from 'uniswap/src/features/transactions/liquidity/types'
import { parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'
import {
  ClassicSwapFlow,
  ClassicSwapSteps,
  DecreasePositionFlow,
  DecreasePositionSteps,
  DecreasePositionTransactionStep,
  IncreasePositionFlow,
  IncreasePositionSteps,
  IncreasePositionTransactionStep,
  IncreasePositionTransactionStepAsync,
  MigratePositionFlow,
  MigratePositionSteps,
  MigratePositionTransactionStep,
  MigratePositionTransactionStepAsync,
  Permit2SignatureStep,
  SwapTransactionStep,
  SwapTransactionStepAsync,
  TokenApprovalTransactionStep,
  TokenRevocationTransactionStep,
  TransactionStep,
  TransactionStepType,
  UniswapXSignatureStep,
  UniswapXSwapFlow,
  UniswapXSwapSteps,
  WrapTransactionStep,
} from 'uniswap/src/features/transactions/swap/types/steps'
import { SwapTxAndGasInfo, isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  ValidatedPermit,
  ValidatedTransactionRequest,
  validateTransactionRequest,
} from 'uniswap/src/features/transactions/swap/utils/trade'
import { parseERC20ApproveCalldata } from 'uniswap/src/utils/approvals'

function orderSwapSteps(flow: ClassicSwapFlow): ClassicSwapSteps[] {
  const steps: ClassicSwapSteps[] = []

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.swap)

  return steps
}

function orderIncreaseLiquiditySteps(flow: IncreasePositionFlow): IncreasePositionSteps[] {
  const steps: IncreasePositionSteps[] = []

  if (flow.revokeToken0) {
    steps.push(flow.revokeToken0)
  }

  if (flow.revokeToken1) {
    steps.push(flow.revokeToken1)
  }

  if (flow.approvalToken0) {
    steps.push(flow.approvalToken0)
  }

  if (flow.approvalToken1) {
    steps.push(flow.approvalToken1)
  }

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.increasePosition)

  return steps
}

function orderMigrateLiquiditySteps(flow: MigratePositionFlow): MigratePositionSteps[] {
  const steps: MigratePositionSteps[] = []

  if (flow.permit) {
    steps.push(flow.permit)
  }

  steps.push(flow.migrate)

  return steps
}

function orderDecreaseLiquiditySteps(flow: DecreasePositionFlow): DecreasePositionSteps[] {
  const steps: DecreasePositionSteps[] = []

  if (flow.approvalPositionToken) {
    steps.push(flow.approvalPositionToken)
  }

  steps.push(flow.decreasePosition)

  return steps
}

function orderUniswapXSteps(flow: UniswapXSwapFlow): UniswapXSwapSteps[] {
  const steps: UniswapXSwapSteps[] = []

  if (flow.wrap) {
    steps.push(flow.wrap)
  }

  if (flow.revocation) {
    steps.push(flow.revocation)
  }

  if (flow.approval) {
    steps.push(flow.approval)
  }

  steps.push(flow.signOrder)

  return steps
}

function createWrapTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  inputAmount: CurrencyAmount<Currency> | undefined,
): WrapTransactionStep | undefined {
  return txRequest && inputAmount
    ? { txRequest, type: TransactionStepType.WrapTransaction, amount: inputAmount }
    : undefined
}

function createApprovalTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  amountIn?: CurrencyAmount<Currency>,
  pair?: [Currency, Currency],
): TokenApprovalTransactionStep | undefined {
  if (!txRequest?.data || !amountIn) {
    return undefined
  }

  const type = TransactionStepType.TokenApprovalTransaction
  const token = amountIn.currency.wrapped
  const { spender } = parseERC20ApproveCalldata(txRequest.data.toString())
  const amount = amountIn.quotient.toString()

  return { type, txRequest, token, spender, amount, pair }
}

function createRevocationTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  token: Token,
): TokenRevocationTransactionStep | undefined {
  if (!txRequest?.data) {
    return undefined
  }

  const type = TransactionStepType.TokenRevocationTransaction
  const { spender, amount } = parseERC20ApproveCalldata(txRequest.data.toString())

  if (amount !== BigInt(0)) {
    return undefined
  }

  return { type, txRequest, token, spender, amount: '0' }
}

function createSignOrderUniswapXStep(
  permitData: ValidatedPermit,
  quote: DutchQuoteV2 | DutchQuoteV3 | PriorityQuote,
): UniswapXSignatureStep {
  return { type: TransactionStepType.UniswapXSignature, deadline: quote.orderInfo.deadline, quote, ...permitData }
}

function createPermit2SignatureStep(permitData: ValidatedPermit, token: Currency): Permit2SignatureStep {
  return { type: TransactionStepType.Permit2Signature, token, ...permitData }
}

function createSwapTransactionStep(txRequest: ValidatedTransactionRequest): SwapTransactionStep {
  return { type: TransactionStepType.SwapTransaction, txRequest }
}

function createSwapTransactionAsyncStep(
  swapRequestArgs: CreateSwapRequest | undefined,
  v4Enabled: boolean,
): SwapTransactionStepAsync {
  return {
    type: TransactionStepType.SwapTransactionAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!swapRequestArgs) {
        return undefined
      }

      const { swap } = await fetchSwap({
        ...swapRequestArgs,
        signature,
        /* simulating transaction provides a more accurate gas limit, and the simulation will succeed because async swap step will only occur after approval has been confirmed. */
        simulateTransaction: true,
        v4Enabled,
      })

      return validateTransactionRequest(swap)
    },
  }
}

function createIncreasePositionStep(txRequest: ValidatedTransactionRequest): IncreasePositionTransactionStep {
  return {
    type: TransactionStepType.IncreasePositionTransaction,
    txRequest,
  }
}

function createCreatePositionAsyncStep(
  createPositionRequestArgs: CreateLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,

    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!createPositionRequestArgs) {
        return undefined
      }

      try {
        const { create } = await createLpPosition({
          ...createPositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return validateTransactionRequest(create)
      } catch (e) {
        throw new Error('create failed to get transaction request', {
          cause: parseErrorMessageTitle(e, { includeRequestId: true }),
        })
      }
    },
  }
}

function createIncreasePositionAsyncStep(
  increasePositionRequestArgs: IncreaseLPPositionRequest | undefined,
): IncreasePositionTransactionStepAsync {
  return {
    type: TransactionStepType.IncreasePositionTransactionAsync,

    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!increasePositionRequestArgs) {
        return undefined
      }

      try {
        const { increase } = await increaseLpPosition({
          ...increasePositionRequestArgs,
          signature,
          simulateTransaction: true,
        })

        return validateTransactionRequest(increase)
      } catch (e) {
        throw new Error('increase failed to get transaction request', {
          cause: parseErrorMessageTitle(e, { includeRequestId: true }),
        })
      }
    },
  }
}

function createDecreasePositionStep(txRequest: ValidatedTransactionRequest): DecreasePositionTransactionStep {
  return {
    type: TransactionStepType.DecreasePositionTransaction,
    txRequest,
  }
}

function createMigratePositionStep(txRequest: ValidatedTransactionRequest): MigratePositionTransactionStep {
  return {
    type: TransactionStepType.MigratePositionTransactionStep,
    txRequest,
  }
}

function createMigratePositionAsyncStep(
  migratePositionRequestArgs: MigrateLPPositionRequest | undefined,
  signatureDeadline: number | undefined,
): MigratePositionTransactionStepAsync {
  return {
    type: TransactionStepType.MigratePositionTransactionStepAsync,
    getTxRequest: async (signature: string): Promise<ValidatedTransactionRequest | undefined> => {
      if (!migratePositionRequestArgs || !signatureDeadline) {
        return undefined
      }

      try {
        const { migrate } = await migrateLpPosition({
          ...migratePositionRequestArgs,
          signature,
          signatureDeadline,
        })

        return validateTransactionRequest(migrate)
      } catch (e) {
        throw new Error('migrate failed to get transaction request', {
          cause: parseErrorMessageTitle(e, { includeRequestId: true }),
        })
      }
    },
  }
}

export function generateTransactionSteps(
  txContext: SwapTxAndGasInfo | LiquidityTxAndGasInfo,
  v4Enabled = false,
): TransactionStep[] {
  const isValidSwap = isValidSwapTxContext(txContext)
  const isValidLP = isValidLiquidityTxContext(txContext)

  if (isValidLP) {
    if (txContext.type === LiquidityTransactionType.Collect) {
      return [
        {
          type: TransactionStepType.CollectFeesTransactionStep,
          txRequest: txContext.txRequest,
        },
      ]
    }

    const { action, approveToken0Request, approveToken1Request, approvePositionTokenRequest } = txContext

    const revokeToken0 = createRevocationTransactionStep(
      txContext.revokeToken0Request,
      action.currency0Amount.currency.wrapped,
    )
    const revokeToken1 = createRevocationTransactionStep(
      txContext.revokeToken1Request,
      action.currency1Amount.currency.wrapped,
    )
    const approvalToken0 = createApprovalTransactionStep(approveToken0Request, action.currency0Amount)
    const approvalToken1 = createApprovalTransactionStep(approveToken1Request, action.currency1Amount)
    const approvalPositionToken = createApprovalTransactionStep(
      approvePositionTokenRequest,
      action.liquidityToken ? CurrencyAmount.fromRawAmount(action.liquidityToken, 1) : undefined,
      [action.currency0Amount.currency, action.currency1Amount.currency],
    )

    switch (txContext.type) {
      case 'decrease':
        return orderDecreaseLiquiditySteps({
          approvalPositionToken,
          decreasePosition: createDecreasePositionStep(txContext.txRequest),
        })
      case 'migrate':
        if (txContext.unsigned) {
          return orderMigrateLiquiditySteps({
            permit: createPermit2SignatureStep(
              txContext.permit,
              // V3->V4 migration requires a permit for the position token which is an NFT.
              // TODO (WEB-4920): Use the proper v3 Position NFT contract and chainId for given chain.
              // For now this placeholder is fine since it's not shown in the UI.
              new Token(1, ADDRESS_ZERO, 1, 'Uniswap V3 Positions NFT-V1', 'Uniswap V3 Positions NFT-V1'),
            ),
            migrate: createMigratePositionAsyncStep(
              txContext.migratePositionRequestArgs,
              txContext.permit.values.deadline as number,
            ),
          })
        } else {
          return orderMigrateLiquiditySteps({
            permit: undefined,
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
            permit: createPermit2SignatureStep(txContext.permit, action.currency0Amount.currency), // TODO: what about for multiple tokens
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
            increasePosition: createIncreasePositionStep(txContext.txRequest),
          })
        }
    }
  } else if (isValidSwap) {
    const { trade, approveTxRequest, revocationTxRequest } = txContext

    const revocation = createRevocationTransactionStep(revocationTxRequest, trade.inputAmount.currency.wrapped)
    const approval = createApprovalTransactionStep(approveTxRequest, trade.inputAmount)

    if (isClassic(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        return orderSwapSteps({
          revocation,
          approval,
          permit: createPermit2SignatureStep(txContext.permit, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs, v4Enabled),
        })
      }

      return orderSwapSteps({
        revocation,
        approval,
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequest),
      })
    } else if (isUniswapX(txContext)) {
      return orderUniswapXSteps({
        revocation,
        approval,
        wrap: createWrapTransactionStep(txContext.wrapTxRequest, trade.inputAmount),
        signOrder: createSignOrderUniswapXStep(txContext.permit, txContext.trade.quote.quote),
      })
    } else if (isBridge(txContext)) {
      const { swapRequestArgs } = txContext

      if (txContext.unsigned) {
        return orderSwapSteps({
          revocation,
          approval,
          permit: createPermit2SignatureStep(txContext.permit, trade.inputAmount.currency),
          swap: createSwapTransactionAsyncStep(swapRequestArgs, v4Enabled),
        })
      }
      return orderSwapSteps({
        revocation,
        approval,
        permit: undefined,
        swap: createSwapTransactionStep(txContext.txRequest),
      })
    }
  }

  return []
}
