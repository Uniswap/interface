import { useMemo } from 'react'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { ActivityRenderData } from 'uniswap/src/features/activity/hooks/useActivityData'
import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_DAY_MS } from 'utilities/src/time/time'
import {
  ActivityFilterType,
  filterTransactionDetailsFromActivityItems,
  getTransactionTypesForFilter,
} from '~/pages/Portfolio/Activity/Filters/utils'

function filterSwapsTypeLast7Days(transactions: ActivityItem[]): TransactionDetails[] {
  const allowedTypes = getTransactionTypesForFilter(ActivityFilterType.Swaps)
  const now = Date.now()
  const sevenDaysAgo = now - 7 * ONE_DAY_MS

  return filterTransactionDetailsFromActivityItems(transactions)
    .filter((tx: TransactionDetails) => allowedTypes !== 'all' && allowedTypes.includes(tx.typeInfo.type))
    .filter((tx: TransactionDetails) => tx.addedTime >= sevenDaysAgo)
}

export function useSwapsThisWeek({ sectionData, isLoading }: ActivityRenderData) {
  const swapsLast7Days = useMemo(() => (sectionData ? filterSwapsTypeLast7Days(sectionData) : []), [sectionData])
  return { count: swapsLast7Days.length, isLoading }
}
