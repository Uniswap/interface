import isEqual from 'lodash/isEqual'
import type { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import type { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { isPlanTransactionDetails } from 'uniswap/src/features/transactions/types/utils'

export const ACTIVITY_ROW_HEIGHT = 67
export const ACTIVITY_HEADER_HEIGHT = 36
export const ON_END_REACHED_THRESHOLD = 0.1
export const SCREEN_DRAW_MULTIPLIER = 2

export function getActivityItemSize(item: ActivityItem): number {
  if (isSectionHeader(item)) {
    return ACTIVITY_HEADER_HEIGHT
  }
  return ACTIVITY_ROW_HEIGHT
}

function transactionItemsAreEqual(prev: TransactionDetails, next: TransactionDetails): boolean {
  if (prev.id !== next.id) {
    return false
  }

  if (prev.status !== next.status || prev.routing !== next.routing || prev.ownerAddress !== next.ownerAddress) {
    return false
  }

  if (isPlanTransactionDetails(prev) && isPlanTransactionDetails(next)) {
    return prev.updatedTime === next.updatedTime
  }

  return prev.addedTime === next.addedTime
}

export function activityItemsAreEqual(prev: ActivityItem, next: ActivityItem): boolean {
  if (isLoadingItem(prev) || isSectionHeader(prev)) {
    return isEqual(prev, next)
  }

  if (isLoadingItem(next) || isSectionHeader(next)) {
    return false
  }

  return transactionItemsAreEqual(prev, next)
}
