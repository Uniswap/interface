import { PlanActivity, PlanTransaction, TokenAmount } from '@uniswap/client-data-api/dist/data/v1/types_pb'
import { TradeType } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import { createTransactionDetails } from 'uniswap/src/features/activity/extract/extractPlanUtils'
import {
  mapDAPIPlanActivitySwapTypeToTAPIPlanStepType,
  mapDAPIPlanStatusToTAPIPlanStatus,
  mapDAPIPlanStatusToTXStatus,
  mapDAPIPlanStepStatusToTXStatus,
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
 * Extract transaction details from an onChain transaction in the REST format
 * Returns an array to support batched transactions (e.g., EXECUTE label with swap + approve)
 */
export default function extractPlanDetails(transaction: PlanTransaction): PlanTransactionDetails | null {
  const { planId, createdAtMillis, lastUserActionAtMillis, status, swapper, assetsIn, assetsOut, activities, gasFee } =
    transaction

  const extractedAssetDetails = extractPlanAssetDetails(assetsIn, assetsOut)
  if (!extractedAssetDetails) {
    return null
  }

  const { tokenInChainId, tokenOutChainId, inputCurrencyId, outputCurrencyId, assetIn, assetOut } =
    extractedAssetDetails

  const sortingTimestampMillis = lastUserActionAtMillis ?? createdAtMillis

  const typeInfo: PlanTransactionInfo = {
    type: TransactionType.Plan,
    planId,
    planStatus: mapDAPIPlanStatusToTAPIPlanStatus(status),
    stepDetails: extractStepDetails({
      activities,
      swapper,
      planId,
      timestampMillis: sortingTimestampMillis,
    }),
    tokenOutChainId,
    inputCurrencyId,
    outputCurrencyId,
    inputCurrencyAmountRaw: assetIn.amount?.raw ?? '0',
    outputCurrencyAmountRaw: assetOut.amount?.raw ?? '0',
    tradeType: TradeType.EXACT_INPUT,
    transactionHashes: activities.map((activity) => activity.transactionHash).filter((hash) => hash !== undefined),
  }

  return {
    routing: TradingApi.Routing.CHAINED,
    id: planId,
    chainId: tokenInChainId,
    status: mapDAPIPlanStatusToTXStatus(status),
    addedTime: Number(createdAtMillis),
    updatedTime: Number(sortingTimestampMillis),
    from: swapper,
    typeInfo,
    // TODO(SWAP-1768): update this logic once we add support for non ETH-native chains in plans
    networkFee: gasFee
      ? {
          tokenSymbol: getChainInfo(tokenInChainId).nativeCurrency.symbol,
          tokenAddress: getChainInfo(tokenInChainId).nativeCurrency.address,
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
 * Extracts and validates plan asset details from assetsIn and assetsOut arrays.
 * Returns the first asset from each array along with validated chainIds and currencyIds.
 * Returns null if validation fails or if assets are missing.
 */
function extractPlanAssetDetails(
  assetsIn: TokenAmount[],
  assetsOut: TokenAmount[],
): {
  tokenInChainId: UniverseChainId
  tokenOutChainId: UniverseChainId
  inputCurrencyId: CurrencyId
  outputCurrencyId: CurrencyId
  assetIn: TokenAmount
  assetOut: TokenAmount
} | null {
  const assetIn = assetsIn[0]
  const assetOut = assetsOut[0]
  if (!assetIn || !assetOut) {
    return null
  }
  const validatedAssetIn = validateAndBuildCurrencyId({
    chainId: assetIn.token?.chainId,
    tokenAddress: assetIn.token?.address,
  })
  const validatedAssetOut = validateAndBuildCurrencyId({
    chainId: assetOut.token?.chainId,
    tokenAddress: assetOut.token?.address,
  })
  if (!validatedAssetOut || !validatedAssetIn) {
    logger.warn('extractPlanDetails', 'extractPlanAssetDetails', 'Invalid plan asset details', {
      assetIn,
      assetOut,
    })
    return null
  }

  return {
    tokenInChainId: validatedAssetIn.chainId,
    tokenOutChainId: validatedAssetOut.chainId,
    inputCurrencyId: validatedAssetIn.currencyId,
    outputCurrencyId: validatedAssetOut.currencyId,
    assetIn,
    assetOut,
  }
}

/**
 * Maps plan activities to transaction type info objects
 */
function extractStepDetails({
  activities,
  swapper,
  planId,
  timestampMillis,
}: {
  activities: PlanActivity[]
  swapper: Address
  planId: string
  timestampMillis: bigint
}): TransactionDetails[] {
  return activities
    .map((activity) => {
      try {
        const planStepType = mapDAPIPlanActivitySwapTypeToTAPIPlanStepType(activity.swapType)
        const {
          tokenIn: { chainId: tokenInChainId, address: tokenInAddress } = {},
          tokenOut: { chainId: tokenOutChainId, address: tokenOutAddress } = {},
          tokenInAmount: { raw: inputCurrencyAmountRaw = '0' } = {},
          tokenOutAmount: { raw: outputCurrencyAmountRaw = '0' } = {},
          transactionHash,
          status: dataApiStatus,
        } = activity
        const status = mapDAPIPlanStepStatusToTXStatus(dataApiStatus)
        const routing = planStepType ? planStepTypeToTradingRoute(planStepType) : TradingApi.Routing.CLASSIC

        return createTransactionDetails({
          tokenInChainId,
          tokenInAddress,
          tokenOutChainId,
          tokenOutAddress,
          routing,
          planId,
          status,
          planStepType,
          inputCurrencyAmountRaw,
          outputCurrencyAmountRaw,
          addedTime: Number(timestampMillis),
          from: swapper,
          hash: transactionHash,
        })
      } catch (error) {
        logger.warn(
          'extractPlanDetails',
          'extractStepDetails',
          'Error when trying to extract step details. Proceeding without activity item.',
          {
            error,
          },
        )
        return null
      }
    })
    .filter((step) => step !== null) as TransactionDetails[]
}
