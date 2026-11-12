import type { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { isLoadingItem, isSectionHeader } from 'uniswap/src/components/activity/utils'
import type { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

/**
 * Type guard to check if an ActivityItem is a TransactionDetails
 * @param item ActivityItem to check
 * @returns true if the item is a TransactionDetails
 */
function isTransactionDetails(item: ActivityItem): item is TransactionDetails {
  // Validate that the item has required TransactionDetails properties
  return (
    'typeInfo' in item && 'addedTime' in item && typeof item.typeInfo === 'object' && typeof item.addedTime === 'number'
  )
}

/**
 * Filters out loading items and section headers, leaving only TransactionDetails
 * @param transactions ActivityItems to filter
 * @returns only TransactionDetails items
 */
export function filterTransactionDetailsFromActivityItems(transactions: ActivityItem[]): TransactionDetails[] {
  return transactions.filter(
    (item): item is TransactionDetails => !isLoadingItem(item) && !isSectionHeader(item) && isTransactionDetails(item),
  )
}
