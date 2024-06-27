/* eslint-disable complexity */
import { createElement, useMemo, useState } from 'react'
import { AppTFunction } from 'ui/src/i18n/types'
import { TXN_HISTORY_LOADER_ICON_SIZE } from 'ui/src/loading/TransactionLoader'
import { iconSizes } from 'ui/src/theme'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import {
  LoadingItem,
  SectionHeader,
  isLoadingItem,
  isSectionHeader,
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
export type ActivityItemRenderer = ({ item }: { item: ActivityItem }) => JSX.Element

export function generateActivityItemRenderer(
  layoutElement: React.FunctionComponent<TransactionSummaryLayoutProps>,
  loadingItem: JSX.Element,
  sectionHeaderElement: React.FunctionComponent<{ title: string }>,
  swapCallbacks: SwapSummaryCallbacks | undefined,
  authTrigger:
    | ((args: { successCallback: () => void; failureCallback: () => void }) => Promise<void>)
    | undefined
): ActivityItemRenderer {
  return function ActivityItemComponent({ item }: { item: ActivityItem }): JSX.Element {
    // if it's a loading item, render the loading placeholder
    if (isLoadingItem(item)) {
      return loadingItem
    }
    // if it's a section header, render it differently
    if (isSectionHeader(item)) {
      return createElement(sectionHeaderElement, { title: item.title, key: item.title })
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
      key: item.id,
      authTrigger,
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
): {
  success: string
  pending?: string
  failed?: string
  canceling?: string
  canceled?: string
} {
  const externalDappName = typeInfo.externalDappInfo?.name

  switch (typeInfo.type) {
    case TransactionType.Swap:
      return {
        success: externalDappName
          ? t('transaction.status.swap.successDapp', { externalDappName })
          : t('transaction.status.swap.success'),
        pending: t('transaction.status.swap.pending'),
        failed: t('transaction.status.swap.failed'),
        canceling: t('transaction.status.swap.canceling'),
        canceled: t('transaction.status.swap.canceled'),
      }
    case TransactionType.Receive:
      return {
        success: externalDappName
          ? t('transaction.status.receive.successDapp', { externalDappName })
          : t('transaction.status.receive.success'),
      }
    case TransactionType.Send:
      return {
        success: externalDappName
          ? t('transaction.status.send.successDapp', { externalDappName })
          : t('transaction.status.send.success'),
        pending: t('transaction.status.send.pending'),
        failed: t('transaction.status.send.failed'),
        canceling: t('transaction.status.send.canceling'),
        canceled: t('transaction.status.send.canceled'),
      }
    case TransactionType.Wrap:
      if (typeInfo.unwrapped) {
        return {
          success: externalDappName
            ? t('transaction.status.unwrap.successDapp', { externalDappName })
            : t('transaction.status.unwrap.success'),
          pending: t('transaction.status.unwrap.pending'),
          failed: t('transaction.status.unwrap.failed'),
          canceling: t('transaction.status.unwrap.canceling'),
          canceled: t('transaction.status.unwrap.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.wrap.successDapp', { externalDappName })
            : t('transaction.status.wrap.success'),
          pending: t('transaction.status.wrap.pending'),
          failed: t('transaction.status.wrap.failed'),
          canceling: t('transaction.status.wrap.canceling'),
          canceled: t('transaction.status.wrap.canceled'),
        }
      }
    case TransactionType.Approve:
      if (typeInfo.approvalAmount === '0.0') {
        return {
          success: externalDappName
            ? t('transaction.status.revoke.successDapp', { externalDappName })
            : t('transaction.status.revoke.success'),
          pending: t('transaction.status.revoke.pending'),
          failed: t('transaction.status.revoke.failed'),
          canceling: t('transaction.status.revoke.canceling'),
          canceled: t('transaction.status.revoke.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.approve.successDapp', { externalDappName })
            : t('transaction.status.approve.success'),
          pending: t('transaction.status.approve.pending'),
          failed: t('transaction.status.approve.failed'),
          canceling: t('transaction.status.approve.canceling'),
          canceled: t('transaction.status.approve.canceled'),
        }
      }
    case TransactionType.NFTApprove:
      return {
        success: externalDappName
          ? t('transaction.status.approve.successDapp', { externalDappName })
          : t('transaction.status.approve.success'),
        pending: t('transaction.status.approve.pending'),
        failed: t('transaction.status.approve.failed'),
        canceling: t('transaction.status.approve.canceling'),
        canceled: t('transaction.status.approve.canceled'),
      }
    case TransactionType.NFTMint:
      return {
        success: externalDappName
          ? t('transaction.status.mint.successDapp', { externalDappName })
          : t('transaction.status.mint.success'),
        pending: t('transaction.status.mint.pending'),
        failed: t('transaction.status.mint.failed'),
        canceling: t('transaction.status.mint.canceling'),
        canceled: t('transaction.status.mint.canceled'),
      }
    case TransactionType.NFTTrade:
      if (typeInfo.tradeType === NFTTradeType.BUY) {
        return {
          success: externalDappName
            ? t('transaction.status.buy.successDapp', { externalDappName })
            : t('transaction.status.buy.success'),
          pending: t('transaction.status.buy.pending'),
          failed: t('transaction.status.buy.failed'),
          canceling: t('transaction.status.buy.canceling'),
          canceled: t('transaction.status.buy.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.sell.successDapp', { externalDappName })
            : t('transaction.status.sell.success'),
          pending: t('transaction.status.sell.pending'),
          failed: t('transaction.status.sell.failed'),
          canceling: t('transaction.status.sell.canceling'),
          canceled: t('transaction.status.sell.canceled'),
        }
      }
    case TransactionType.FiatPurchase:
      if (typeInfo.inputSymbol && typeInfo.inputSymbol === typeInfo.outputSymbol) {
        return {
          success: externalDappName
            ? t('transaction.status.receive.successDapp', { externalDappName })
            : t('transaction.status.receive.success'),
          pending: t('transaction.status.receive.pending'),
          failed: t('transaction.status.receive.failed'),
          canceling: t('transaction.status.receive.canceling'),
          canceled: t('transaction.status.receive.canceled'),
        }
      } else {
        return {
          success: externalDappName
            ? t('transaction.status.purchase.successDapp', { externalDappName })
            : t('transaction.status.purchase.success'),
          pending: t('transaction.status.purchase.pending'),
          failed: t('transaction.status.purchase.failed'),
          canceling: t('transaction.status.purchase.canceling'),
          canceled: t('transaction.status.purchase.canceled'),
        }
      }
    case TransactionType.Unknown:
    case TransactionType.WCConfirm:
    default:
      return {
        success: externalDappName
          ? t('transaction.status.confirm.successDapp', { externalDappName })
          : t('transaction.status.confirm.success'),
        pending: t('transaction.status.confirm.pending'),
        failed: t('transaction.status.confirm.failed'),
        canceling: t('transaction.status.confirm.canceling'),
        canceled: t('transaction.status.confirm.canceled'),
      }
  }
}

export function getTransactionSummaryTitle(
  tx: TransactionDetails,
  t: AppTFunction
): string | undefined {
  const { success, pending, failed, canceling, canceled } = getTransactionTypeVerbs(tx.typeInfo, t)

  switch (tx.status) {
    case TransactionStatus.Pending:
      return pending
    case TransactionStatus.Cancelling:
      return canceling
    case TransactionStatus.Canceled:
      return canceled
    case TransactionStatus.Failed:
      return failed
    case TransactionStatus.Success:
      return success
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
