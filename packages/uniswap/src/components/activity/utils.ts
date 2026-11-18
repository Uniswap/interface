import { TXN_HISTORY_LOADER_ICON_SIZE, iconSizes } from '@universe/mycelium'
import {
  isReceiveTokenTransactionInfo,
  isSendTokenTransactionInfo,
} from 'uniswap/src/components/activity/details/types'
import type { ActivityItem } from 'uniswap/src/components/activity/generateActivityItemRenderer'
import { AssetType } from 'uniswap/src/entities/assets'
import { LocalizationContextState } from 'uniswap/src/features/language/LocalizationContext'
import {
  INFINITE_APPROVAL_AMOUNT,
  REVOKE_APPROVAL_AMOUNT,
  TransactionType,
  TransactionTypeInfo,
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

// Max approvals arrive as uint96, uint160 or uint256 max scaled by the token's decimals, so no single
// sentinel matches them all; any decimal-adjusted amount above this is shown as unlimited.
const UNLIMITED_APPROVAL_THRESHOLD = 1e9

/**
 * Formats an approval amount for display.
 * Returns "Unlimited" for infinite approvals or amounts above 1B, a formatted number for regular approvals,
 * or an empty string for revokes.
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
  if (approvalAmount === INFINITE_APPROVAL_AMOUNT || Number(approvalAmount) > UNLIMITED_APPROVAL_THRESHOLD) {
    return t('transaction.amount.unlimited')
  }

  if (approvalAmount && approvalAmount !== REVOKE_APPROVAL_AMOUNT) {
    return formatNumberOrString({ value: approvalAmount, type: NumberType.TokenNonTx })
  }

  return ''
}

export function isNFTActivity(typeInfo: TransactionTypeInfo): boolean {
  const isTransferNft =
    (isReceiveTokenTransactionInfo(typeInfo) || isSendTokenTransactionInfo(typeInfo)) &&
    typeInfo.assetType !== AssetType.Currency
  const isNft =
    isTransferNft ||
    [TransactionType.NFTApprove, TransactionType.NFTMint, TransactionType.NFTTrade].includes(typeInfo.type)
  return isNft
}
