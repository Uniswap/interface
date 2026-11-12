import { EARN_SWAP_UPSELL_ELIGIBLE_CURRENCY_IDS } from 'uniswap/src/features/earn/launchAssets'
import {
  type PlanTransactionInfo,
  TransactionStatus,
  TransactionType,
  type TransactionTypeInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { areCurrencyIdsEqual, currencyIdToChain } from 'uniswap/src/utils/currencyId'

export function getEarnSwapUpsellOutputCurrencyId({
  status,
  typeInfo,
}: {
  status: TransactionStatus
  typeInfo: TransactionTypeInfo
}): string | undefined {
  if (status !== TransactionStatus.Success) {
    return undefined
  }

  switch (typeInfo.type) {
    case TransactionType.Bridge:
    case TransactionType.Swap: {
      if (typeInfo.planId) {
        return undefined
      }

      return getValidEarnSwapUpsellCurrencyId(typeInfo.outputCurrencyId)
    }
    case TransactionType.Plan: {
      if (isEarnPlan(typeInfo)) {
        return undefined
      }

      return getValidEarnSwapUpsellCurrencyId(typeInfo.outputCurrencyId)
    }
    default: {
      return undefined
    }
  }
}

/**
 * TAPI marks Earn plans explicitly. DAPI currently does not, but vault plan steps are extracted as
 * opaque CHAINED/Unknown steps, so those count as Earn too.
 */
export function isEarnPlan(typeInfo: PlanTransactionInfo): boolean {
  return !!typeInfo.earnAction || typeInfo.stepDetails.some((step) => step.typeInfo.type === TransactionType.Unknown)
}

export function getValidEarnSwapUpsellCurrencyId(outputCurrencyId: string | undefined): string | undefined {
  if (!outputCurrencyId || !currencyIdToChain(outputCurrencyId)) {
    return undefined
  }

  return EARN_SWAP_UPSELL_ELIGIBLE_CURRENCY_IDS.find((eligibleCurrencyId) =>
    areCurrencyIdsEqual(outputCurrencyId, eligibleCurrencyId),
  )
}
