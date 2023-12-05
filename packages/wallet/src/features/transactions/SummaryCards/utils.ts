import { createElement, useMemo, useState } from 'react'
import { AppTFunction } from 'ui/src/i18n/types'
import { TXN_HISTORY_LOADER_ICON_SIZE } from 'ui/src/loading/TransactionLoader'
import { iconSizes } from 'ui/src/theme'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import {
  isLoadingItem,
  isSectionHeader,
  LoadingItem,
  SectionHeader,
} from 'wallet/src/features/activity/utils'
import {
  FORMAT_DATE_MONTH_DAY,
  FORMAT_TIME_SHORT,
  useLocalizedDayjs,
} from 'wallet/src/features/language/localizedDayjs'
import {
  NFTTradeType,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'wallet/src/features/transactions/types'
import { ApproveSummaryItem } from './SummaryItems/ApproveSummaryItem'
import { FiatPurchaseSummaryItem } from './SummaryItems/FiatPurchaseSummaryItem'
import { NFTApproveSummaryItem } from './SummaryItems/NFTApproveSummaryItem'
import { NFTMintSummaryItem } from './SummaryItems/NFTMintSummaryItem'
import { NFTTradeSummaryItem } from './SummaryItems/NFTTradeSummaryItem'
import { ReceiveSummaryItem } from './SummaryItems/ReceiveSummaryItem'
import { SendSummaryItem } from './SummaryItems/SendSummaryItem'
import { SwapSummaryItem } from './SummaryItems/SwapSummaryItem'
import { UnknownSummaryItem } from './SummaryItems/UnknownSummaryItem'
import { WCSummaryItem } from './SummaryItems/WCSummaryItem'
import { WrapSummaryItem } from './SummaryItems/WrapSummaryItem'
import { SummaryItemProps, SwapSummaryCallbacks, TransactionSummaryLayoutProps } from './types'

export const TXN_HISTORY_ICON_SIZE = TXN_HISTORY_LOADER_ICON_SIZE
export const TXN_STATUS_ICON_SIZE = iconSizes.icon16

export type ActivityItem = TransactionDetails | SectionHeader | LoadingItem
type ActivityItemRenderer = ({ item }: { item: ActivityItem }) => JSX.Element

export function generateActivityItemRenderer(
  layoutElement: React.FunctionComponent<TransactionSummaryLayoutProps>,
  loadingItem: JSX.Element,
  sectionHeaderElement: React.FunctionComponent<{ title: string }>,
  swapCallbacks?: SwapSummaryCallbacks
): ActivityItemRenderer {
  return function ActivityItemComponent({ item }: { item: ActivityItem }): JSX.Element {
    // if it's a loading item, render the loading placeholder
    if (isLoadingItem(item)) {
      return loadingItem
    }
    // if it's a section header, render it differently
    if (isSectionHeader(item)) {
      return createElement(sectionHeaderElement, { title: item.title })
    }
    // item is a transaction
    let SummaryItem
    switch (item.typeInfo.type) {
      case TransactionType.Approve:
        SummaryItem = ApproveSummaryItem
        break
      case TransactionType.FiatPurchase:
        SummaryItem = FiatPurchaseSummaryItem
        break
      case TransactionType.NFTApprove:
        SummaryItem = NFTApproveSummaryItem
        break
      case TransactionType.NFTMint:
        SummaryItem = NFTMintSummaryItem
        break
      case TransactionType.NFTTrade:
        SummaryItem = NFTTradeSummaryItem
        break
      case TransactionType.Receive:
        SummaryItem = ReceiveSummaryItem
        break
      case TransactionType.Send:
        SummaryItem = SendSummaryItem
        break
      case TransactionType.Swap:
        SummaryItem = SwapSummaryItem
        break
      case TransactionType.WCConfirm:
        SummaryItem = WCSummaryItem
        break
      case TransactionType.Wrap:
        SummaryItem = WrapSummaryItem
        break
      default:
        SummaryItem = UnknownSummaryItem
    }

    return createElement(SummaryItem as React.FunctionComponent<SummaryItemProps>, {
      transaction: item,
      layoutElement,
      swapCallbacks,
    })
  }
}

/*
 * Get verb form for transaction type
 * @returns {Array.<string|string?>} An array of strings with the following structure:
 * [0]: Past verb form (e.g. 'Swapped')
 * [1]: Present verb form (e.g. 'Swapping') (optional)
 * [2]: Base verb form (e.g. 'swap') (optional)
 */
function getTransactionTypeVerbs(
  typeInfo: TransactionDetails['typeInfo'],
  t: AppTFunction
): [string, string?, string?] {
  switch (typeInfo.type) {
    case TransactionType.Swap:
      return [t('Swapped'), t('Swapping'), t('swap')]
    case TransactionType.Receive:
      return [t('Received')]
    case TransactionType.Send:
      return [t('Sent'), t('Sending'), t('send')]
    case TransactionType.Wrap:
      if (typeInfo.unwrapped) {
        return [t('Unwrapped'), t('Unwrapping'), t('unwrap')]
      } else {
        return [t('Wrapped'), t('Wrapping'), t('wrap')]
      }
    case TransactionType.Approve:
      if (typeInfo.approvalAmount === '0.0') {
        return [t('Revoked'), t('Revoking'), t('revoke')]
      } else {
        return [t('Approved'), t('Approving'), t('approve')]
      }
    case TransactionType.NFTApprove:
      return [t('Approved'), t('Approving'), t('approve')]
    case TransactionType.NFTMint:
      return [t('Minted'), t('Minting'), t('mint')]
    case TransactionType.NFTTrade:
      if (typeInfo.tradeType === NFTTradeType.BUY) {
        return [t('Bought'), t('Buying'), t('buy')]
      } else {
        return [t('Sold'), t('Selling'), t('sell')]
      }
    case TransactionType.FiatPurchase:
      return [t('Purchased'), t('Purchasing'), t('purchase')]
    case TransactionType.Unknown:
    case TransactionType.WCConfirm:
    default:
      return [t('Transaction confirmed'), t('Transaction in progress'), t('confirm')]
  }
}

export function getTransactionSummaryTitle(
  tx: TransactionDetails,
  t: AppTFunction
): string | undefined {
  const [completed, inProgress, action] = getTransactionTypeVerbs(tx.typeInfo, t)
  const externalDappName = tx.typeInfo.externalDappInfo?.name
  switch (tx.status) {
    case TransactionStatus.Pending:
      return inProgress
    case TransactionStatus.Cancelling:
      return t('Cancelling {{action}}', { action })
    case TransactionStatus.Cancelled:
      return t('Cancelled {{action}}', { action })
    case TransactionStatus.Failed:
      return t('Failed to {{action}}', { action })
    case TransactionStatus.Success:
      if (externalDappName) {
        return t('{{completed}} on {{externalDappName}}', { completed, externalDappName })
      }
      return completed
    default:
      return undefined
  }
}

function useForceUpdateEveryMinute(): number {
  const [unixTime, setUnixTime] = useState(Date.now())
  useInterval(() => {
    setUnixTime(Date.now())
  }, ONE_MINUTE_MS)
  return unixTime
}

export function useFormattedTime(time: number): string {
  // we need to update formattedAddedTime every minute as it can be relative
  const unixTime = useForceUpdateEveryMinute()
  const localizedDayjs = useLocalizedDayjs()

  return useMemo(() => {
    const wrappedAddedTime = localizedDayjs(time)
    return localizedDayjs().isBefore(wrappedAddedTime.add(59, 'minute'), 'minute')
      ? // We do not use dayjs.duration() as it uses Math.round under the hood,
        // so for the first 30s it would show 0 minutes
        `${Math.ceil(localizedDayjs().diff(wrappedAddedTime) / ONE_MINUTE_MS)}m` // within an hour
      : localizedDayjs().isBefore(wrappedAddedTime.add(24, 'hour'))
      ? wrappedAddedTime.format(FORMAT_TIME_SHORT) // within last 24 hours
      : wrappedAddedTime.format(FORMAT_DATE_MONTH_DAY) // current year
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [time, unixTime, localizedDayjs])
}
