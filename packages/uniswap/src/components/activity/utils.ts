import { TXN_HISTORY_LOADER_ICON_SIZE } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import {
  INFINITE_APPROVAL_AMOUNT,
  INFINITE_APPROVAL_NUMBER,
  INFINITE_APPROVAL_NUMBER_PERMIT2,
  REVOKE_APPROVAL_AMOUNT,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { NumberType } from 'utilities/src/format/types'

export const TXN_HISTORY_ICON_SIZE = TXN_HISTORY_LOADER_ICON_SIZE
export const TXN_STATUS_ICON_SIZE = iconSizes.icon16

export type LoadingItem = {
  itemType: 'LOADING'
  id: number
}
export function isLoadingItem(x: ActivityItem): x is LoadingItem {
  return 'itemType' in x && x.itemType === 'LOADING'
}

export type SectionHeader = {
  itemType: 'HEADER'
  title: string
}
export function isSectionHeader(x: ActivityItem): x is SectionHeader {
  return 'itemType' in x && x.itemType === 'HEADER'
}

export function getActivityItemType(item: ActivityItem): string {
  if (isLoadingItem(item)) {
    return `loading`
  } else if (isSectionHeader(item)) {
    return `sectionHeader`
  } else {
    return `activity`
  }
}

/**
 * Formats an approval amount for display.
 * Returns "unlimited" for infinite approvals, "Max approve" for very large amounts (>999T), formatted number for regular approvals, or empty string for revokes.
 */
export function formatApprovalAmount({
  approvalAmount,
  formatNumberOrString,
  t,
}: {
  approvalAmount: string | undefined
  formatNumberOrString: LocalizationContextState['formatNumberOrString']
  t: (key: string) => string
}): string {
  if (
    approvalAmount === INFINITE_APPROVAL_AMOUNT ||
    approvalAmount === INFINITE_APPROVAL_NUMBER ||
    approvalAmount === INFINITE_APPROVAL_NUMBER_PERMIT2
  ) {
    return t('transaction.amount.unlimited')
  }

  if (approvalAmount && approvalAmount !== REVOKE_APPROVAL_AMOUNT) {
    const formatted = formatNumberOrString({ value: approvalAmount, type: NumberType.TokenNonTx })
    return formatted
  }

  return ''
}
