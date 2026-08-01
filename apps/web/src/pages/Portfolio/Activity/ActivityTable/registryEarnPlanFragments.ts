import { getEarnPlanDisplayInfo } from 'uniswap/src/features/activity/utils/getEarnPlanDisplayInfo'
import { getEarnPlanStatusTitleKeyFromTransactionStatus } from 'uniswap/src/features/earn/planActivityTitles'
import {
  TransactionStatus,
  TransactionType,
  type PlanTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ActivityRowFragments } from '~/pages/Portfolio/Activity/ActivityTable/activityTableModels'
import { ActivityFilterType } from '~/pages/Portfolio/Activity/Filters/activityFilterTypes'

export function buildEarnPlanActivityRowFragments(
  typeInfo: PlanTransactionInfo,
  status: TransactionStatus,
): ActivityRowFragments {
  const earnAction = typeInfo.earnAction
  if (!earnAction) {
    return {}
  }

  const displayInfo = getEarnPlanDisplayInfo(typeInfo)

  return {
    amount: displayInfo
      ? {
          kind: 'single',
          currencyId: displayInfo.currencyId,
          amountRaw: displayInfo.amountRaw,
        }
      : undefined,
    counterparty: null,
    typeLabel: {
      baseGroup:
        displayInfo?.transactionType === TransactionType.Withdraw
          ? ActivityFilterType.Receives
          : ActivityFilterType.Sends,
      overrideLabelKey: getEarnPlanStatusTitleKeyFromTransactionStatus({
        earnAction,
        transactionStatus: status,
      }),
    },
  }
}
