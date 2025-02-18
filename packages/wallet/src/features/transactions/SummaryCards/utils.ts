/* eslint-disable complexity */
import { createElement, useMemo, useState } from 'react'
import { TXN_HISTORY_LOADER_ICON_SIZE } from 'ui/src'
import { AppTFunction } from 'ui/src/i18n/types'
import { iconSizes } from 'ui/src/theme'
import {
  FORMAT_DATE_MONTH_DAY,
  FORMAT_TIME_SHORT,
  useLocalizedDayjs,
} from 'uniswap/src/features/language/localizedDayjs'
import {
  NFTTradeType,
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'
import { useInterval } from 'utilities/src/time/timing'
import { LoadingItem, SectionHeader, isLoadingItem, isSectionHeader } from 'wallet/src/features/activity/utils'
import { ApproveSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/ApproveSummaryItem'
import { BridgeSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/BridgeSummaryItem'
import { NFTApproveSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTApproveSummaryItem'
import { NFTMintSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTMintSummaryItem'
import { NFTTradeSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/NFTTradeSummaryItem'
import { OffRampTransferSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/OffRampTransferSummaryItem'
import { OnRampTransferSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/OnRampTransferSummaryItem'
import { ReceiveSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/ReceiveSummaryItem'
import { SendSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/SendSummaryItem'
import { SwapSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/SwapSummaryItem'
import { UnknownSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/UnknownSummaryItem'
import { WCSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/WCSummaryItem'
import { WrapSummaryItem } from 'wallet/src/features/transactions/SummaryCards/SummaryItems/WrapSummaryItem'
import { SummaryItemProps, SwapSummaryCallbacks } from 'wallet/src/features/transactions/SummaryCards/types'

export const TXN_HISTORY_ICON_SIZE = TXN_HISTORY_LOADER_ICON_SIZE
export const TXN_STATUS_ICON_SIZE = iconSizes.icon16

const MAX_SHOW_RETRY_TIME = 15 * ONE_MINUTE_MS

export type ActivityItem = TransactionDetails | SectionHeader | LoadingItem
export type ActivityItemRenderer = ({ item, index }: { item: ActivityItem; index: number }) => JSX.Element

export function generateActivityItemRenderer(
  loadingItem: JSX.Element,
  sectionHeaderElement: React.FunctionComponent<{ title: string; index?: number }>,
  swapCallbacks: SwapSummaryCallbacks | undefined,
  authTrigger: ((args: { successCallback: () => void; failureCallback: () => void }) => Promise<void>) | undefined,
): ActivityItemRenderer {
  return function ActivityItemComponent({ item, index }: { item: ActivityItem; index: number }): JSX.Element {
    // if it's a loading item, render the loading placeholder
    if (isLoadingItem(item)) {
      return loadingItem
    }
    // if it's a section header, render it differently
    if (isSectionHeader(item)) {
      return createElement(sectionHeaderElement, { title: item.title, key: item.title, index })
    }
    // item is a transaction
    let SummaryItem
    switch (item.typeInfo.type) {
      case TransactionType.Approve:
        SummaryItem = ApproveSummaryItem
        break
      case TransactionType.OnRampPurchase:
      case TransactionType.OnRampTransfer:
        SummaryItem = OnRampTransferSummaryItem
        break
      case TransactionType.OffRampSale:
        SummaryItem = OffRampTransferSummaryItem
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
      case TransactionType.Bridge:
        SummaryItem = BridgeSummaryItem
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
      swapCallbacks,
      index,
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
  t: AppTFunction,
): {
  success: string
  pending?: string
  failed?: string
  canceling?: string
  canceled?: string
  expired?: string
  insufficientFunds?: string
} {
  const externalDappName = typeInfo.externalDappInfo?.name

  switch (typeInfo.type) {
    case TransactionType.Bridge:
    case TransactionType.Swap:
      return {
        success: externalDappName
          ? t('transaction.status.swap.successDapp', { externalDappName })
          : t('transaction.status.swap.success'),
        pending: t('transaction.status.swap.pending'),
        failed: t('transaction.status.swap.failed'),
        canceling: t('transaction.status.swap.canceling'),
        canceled: t('transaction.status.swap.canceled'),
        expired: t('transaction.status.swap.expired'),
        insufficientFunds: t('transaction.status.swap.insufficientFunds'),
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
    case TransactionType.OnRampPurchase: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.purchase.successOn', { serviceProvider }),
        pending: t('transaction.status.purchase.pendingOn', { serviceProvider }),
        failed: t('transaction.status.purchase.failedOn', { serviceProvider }),
        canceling: t('transaction.status.purchase.canceling'), // On ramp transactions are not cancellable
        canceled: t('transaction.status.purchase.canceled'), // On ramp transactions are not cancellable
      }
    }
    case TransactionType.OnRampTransfer: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.receive.successFrom', { serviceProvider }),
        pending: t('transaction.status.receive.pendingFrom', { serviceProvider }),
        failed: t('transaction.status.receive.failedFrom', { serviceProvider }),
        canceling: t('transaction.status.receive.canceling'), // On ramp transactions are not cancellable
        canceled: t('transaction.status.receive.canceled'), // On ramp transactions are not cancellable
      }
    }
    case TransactionType.OffRampSale: {
      const serviceProvider = typeInfo.serviceProvider.name
      return {
        success: t('transaction.status.sale.successOn', { serviceProvider }),
        pending: t('transaction.status.sale.pendingOn', { serviceProvider }),
        failed: t('transaction.status.sale.failedOn', { serviceProvider }),
        canceling: t('transaction.status.sale.canceling'), // Offramp transactions are not cancellable
        canceled: t('transaction.status.sale.canceled'), // Offramp transactions are not cancellable
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

export function getTransactionSummaryTitle(tx: TransactionDetails, t: AppTFunction): string | undefined {
  const { success, pending, failed, canceling, canceled, expired, insufficientFunds } = getTransactionTypeVerbs(
    tx.typeInfo,
    t,
  )

  switch (tx.status) {
    case TransactionStatus.Pending:
      return pending
    case TransactionStatus.Cancelling:
      return canceling
    case TransactionStatus.Expired:
      return expired
    case TransactionStatus.InsufficientFunds:
      return insufficientFunds
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

export function useOnRetrySwap(
  transaction: TransactionDetails,
  swapCallbacks: SwapSummaryCallbacks | undefined,
): (() => void) | undefined {
  // For retrying failed, locally submitted swaps
  const swapFormState = swapCallbacks?.useSwapFormTransactionState(
    transaction.from,
    transaction.chainId,
    transaction.id,
  )

  const latestSwapTx = swapCallbacks?.useLatestSwapTransaction(transaction.from)
  const isTheLatestSwap = latestSwapTx && latestSwapTx.id === transaction.id
  // if this is the latest tx or it was added within the last 15 minutes, show the retry button
  const shouldShowRetry =
    isTheLatestSwap || (Date.now() - transaction.addedTime < MAX_SHOW_RETRY_TIME && swapCallbacks?.onRetryGenerator)

  const onRetry = swapCallbacks?.onRetryGenerator?.(swapFormState)
  return swapFormState && shouldShowRetry ? onRetry : undefined
}
