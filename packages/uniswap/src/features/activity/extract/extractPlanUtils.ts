import { TradingApi } from '@universe/api'
import {
  TransactionDetails,
  TransactionOriginType,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { MaybeChainId, validateAndBuildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

/**
 * Constructs a TransactionDetails object from validated transaction details based on the
 * routing type.
 */
export function createTransactionDetails(params: {
  routing: TradingApi.Routing
  planId: string
  status: TransactionStatus
  planStepType?: TradingApi.PlanStepType
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
  addedTime: number
  from: Address
  hash: string | undefined
  tokenInChainId?: MaybeChainId
  tokenOutChainId?: MaybeChainId
  tokenInAddress?: Address
  tokenOutAddress?: Address
}): TransactionDetails | null {
  const {
    routing,
    planStepType,
    planId,
    status,
    tokenInChainId,
    tokenInAddress,
    tokenOutChainId,
    tokenOutAddress,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
    addedTime,
    from,
    hash,
  } = params

  const validatedTokenIn = validateAndBuildCurrencyId({
    chainId: tokenInChainId,
    tokenAddress: tokenInAddress,
  })
  if (!validatedTokenIn) {
    return null
  }

  const baseTransactionDetails = {
    id: planId,
    chainId: validatedTokenIn.chainId,
    status,
    hash, // Plan steps may not have a hash until executed
    addedTime: Number(addedTime),
    // TODO: SWAP-847 - Use updated time
    updatedTime: Number(addedTime),
    from,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
  }
  switch (routing) {
    case TradingApi.Routing.CLASSIC:
      switch (planStepType) {
        case TradingApi.PlanStepType.APPROVAL_TXN:
        case TradingApi.PlanStepType.RESET_APPROVAL_TXN:
          return {
            ...baseTransactionDetails,
            routing,
            typeInfo: {
              type: TransactionType.Approve,
              tokenAddress: validatedTokenIn.tokenAddress,
              spender: from,
              approvalAmount: inputCurrencyAmountRaw,
            },
          }
        case TradingApi.PlanStepType.APPROVAL_PERMIT:
          return {
            ...baseTransactionDetails,
            routing,
            typeInfo: {
              type: TransactionType.Permit2Approve,
              tokenAddress: validatedTokenIn.tokenAddress,
              spender: from,
            },
          }
        default: {
          const validatedOutputToken = validateAndBuildCurrencyId({
            chainId: tokenOutChainId,
            tokenAddress: tokenOutAddress,
          })
          if (!validatedOutputToken) {
            return null
          }

          return {
            ...baseTransactionDetails,
            routing,
            typeInfo: {
              type: TransactionType.Swap,
              inputCurrencyId: validatedTokenIn.currencyId,
              outputCurrencyId: validatedOutputToken.currencyId,
              inputCurrencyAmountRaw,
              outputCurrencyAmountRaw,
            },
          }
        }
      }
    case TradingApi.Routing.DUTCH_LIMIT:
    case TradingApi.Routing.DUTCH_V2:
    case TradingApi.Routing.DUTCH_V3:
    case TradingApi.Routing.PRIORITY: {
      const validatedOutputToken = validateAndBuildCurrencyId({
        chainId: tokenOutChainId,
        tokenAddress: tokenOutAddress,
      })
      if (!validatedOutputToken) {
        return null
      }
      return {
        ...baseTransactionDetails,
        routing,
        typeInfo: {
          type: TransactionType.Swap,
          inputCurrencyId: validatedTokenIn.currencyId,
          outputCurrencyId: validatedOutputToken.currencyId,
          inputCurrencyAmountRaw,
          outputCurrencyAmountRaw,
        },
      }
    }
    case TradingApi.Routing.BRIDGE: {
      const validatedOutputToken = validateAndBuildCurrencyId({
        chainId: tokenOutChainId,
        tokenAddress: tokenOutAddress,
      })
      if (!validatedOutputToken) {
        return null
      }
      return {
        ...baseTransactionDetails,
        routing,
        typeInfo: {
          type: TransactionType.Bridge,
          inputCurrencyId: validatedTokenIn.currencyId,
          outputCurrencyId: validatedOutputToken.currencyId,
          inputCurrencyAmountRaw,
          outputCurrencyAmountRaw,
        },
      }
    }
    case TradingApi.Routing.WRAP:
    case TradingApi.Routing.UNWRAP:
      return {
        ...baseTransactionDetails,
        routing,
        typeInfo: {
          type: TransactionType.Wrap,
          unwrapped: planStepType === TradingApi.PlanStepType.UNWRAP,
          currencyAmountRaw: inputCurrencyAmountRaw,
        },
      }
    case TradingApi.Routing.LIMIT_ORDER:
    default:
      logger.warn('extractPlanResponseDetails', 'createTransactionDetailsForRouting', 'Unknown routing in plan step', {
        routing,
      })
      return null
  }
}
