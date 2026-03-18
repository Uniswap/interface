import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { createTransactionDetails } from 'uniswap/src/features/activity/extract/extractPlanUtils'
import {
  mapTAPIPlanStatusToTXStatus,
  mapTAPIPlanStepStatusToTXStatus,
} from 'uniswap/src/features/activity/extract/statusMappers'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ValueType } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { planStepTypeToTradingRoute } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  PlanTransactionDetails,
  PlanTransactionInfo,
  TransactionDetails,
  TransactionOriginType,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyId } from 'uniswap/src/types/currency'
import { validateAndBuildCurrencyId } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

/**
 * Extract transaction details from a TradingApi.PlanResponse
 * Returns a PlanTransactionDetails object representing the plan transaction
 */
export default function extractPlanResponseDetails(
  planResponse: TradingApi.PlanResponse | undefined,
): PlanTransactionDetails | null {
  if (!planResponse) {
    return null
  }
  const { planId, swapper, status, steps, createdAt, lastUserActionAt, gasFee } = planResponse

  const extractedAssetDetails = extractPlanResponseAssetDetails(steps)
  if (!extractedAssetDetails || !createdAt) {
    logger.error(new Error('Invalid data for plan response.'), {
      tags: {
        file: 'extractPlanResponseDetails',
        function: 'extractPlanResponseDetails',
      },
      extra: {
        planId,
      },
    })
    return null
  }
  const {
    tokenInChainId,
    tokenOutChainId,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
  } = extractedAssetDetails

  const createdAtMillis = new Date(createdAt).getTime()
  const sortingTimestampMillis = new Date(lastUserActionAt ?? createdAt).getTime()

  const typeInfo: PlanTransactionInfo = {
    type: TransactionType.Plan,
    planId,
    planStatus: status,
    stepDetails: extractStepDetailsFromPlanResponse({
      steps,
      swapper,
      planId,
      updatedMillis: sortingTimestampMillis,
    }),
    tokenOutChainId,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw,
    outputCurrencyAmountRaw,
    tradeType: TradeType.EXACT_INPUT,
    transactionHashes: steps
      .map((step) => step.proof?.txHash ?? step.proof?.orderId)
      .filter((hash) => hash !== undefined),
  }

  const nativeCurrency = getChainInfo(tokenInChainId).nativeCurrency

  return {
    routing: TradingApi.Routing.CHAINED,
    id: planId,
    chainId: tokenInChainId,
    status: mapTAPIPlanStatusToTXStatus(status),
    addedTime: createdAtMillis,
    updatedTime: sortingTimestampMillis,
    from: swapper,
    typeInfo,
    // TODO(SWAP-1768): update this logic once we add support for non ETH-native chains in plans
    networkFee: gasFee
      ? {
          tokenSymbol: nativeCurrency.symbol,
          tokenAddress: nativeCurrency.address,
          chainId: tokenInChainId,
          quantity: gasFee,
          valueType: ValueType.Raw,
        }
      : undefined,
    transactionOriginType: TransactionOriginType.Internal,
    options: { request: {} },
  }
}

/**
 * Extracts and validates plan asset details from PlanResponse steps.
 * Uses the first step to determine input info, and the last step to determine output info.
 * Returns null if validation fails or if steps are empty.
 */
export function extractPlanResponseAssetDetails(steps: TradingApi.PlanStep[]): {
  tokenInChainId: UniverseChainId
  tokenOutChainId: UniverseChainId
  inputCurrencyId: CurrencyId
  outputCurrencyId: CurrencyId
  inputCurrencyAmountRaw: string
  outputCurrencyAmountRaw: string
} | null {
  if (!steps.length) {
    return null
  }

  const firstStep = steps[0]
  const lastStep = steps[steps.length - 1]
  const { tokenIn, tokenInChainId, tokenInAmount } = firstStep ?? {}
  const { tokenOut, tokenOutChainId, tokenOutAmount } = lastStep ?? {}

  const validatedTokenIn = validateAndBuildCurrencyId({ chainId: tokenInChainId, tokenAddress: tokenIn })
  const validatedTokenOut = validateAndBuildCurrencyId({ chainId: tokenOutChainId, tokenAddress: tokenOut })
  if (!validatedTokenIn || !validatedTokenOut || !tokenInAmount || !tokenOutAmount) {
    logger.warn(
      'extractPlanResponseDetails',
      'extractPlanResponseAssetDetails',
      'Missing input and output token details ',
      {
        firstStep,
        lastStep,
      },
    )
    return null
  }

  return {
    tokenInChainId: validatedTokenIn.chainId,
    tokenOutChainId: validatedTokenOut.chainId,
    inputCurrencyId: validatedTokenIn.currencyId,
    outputCurrencyId: validatedTokenOut.currencyId,
    inputCurrencyAmountRaw: tokenInAmount,
    outputCurrencyAmountRaw: tokenOutAmount,
  }
}

/**
 * Converts the individual plan steps into TransactionDetails objects
 */
function extractStepDetailsFromPlanResponse({
  steps,
  swapper,
  planId,
  updatedMillis,
}: {
  steps: TradingApi.PlanStep[]
  swapper: Address
  planId: string
  updatedMillis: number
}): TransactionDetails[] {
  return steps
    .map((step) => {
      const planStepType = step.stepType
      return createTransactionDetails({
        tokenInChainId: step.tokenInChainId,
        tokenInAddress: step.tokenIn,
        tokenOutChainId: step.tokenOutChainId,
        tokenOutAddress: step.tokenOut,
        routing: planStepType ? planStepTypeToTradingRoute(planStepType) : TradingApi.Routing.CLASSIC,
        planId,
        status: mapTAPIPlanStepStatusToTXStatus(step.status),
        planStepType,
        inputCurrencyAmountRaw: step.tokenInAmount ?? '0',
        outputCurrencyAmountRaw: step.tokenOutAmount ?? '0',
        addedTime: updatedMillis,
        from: swapper,
        hash: step.proof?.txHash ?? step.proof?.orderId,
      })
    })
    .filter((step) => step !== null)
}
