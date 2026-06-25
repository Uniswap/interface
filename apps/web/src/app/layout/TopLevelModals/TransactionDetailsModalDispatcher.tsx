/**
 * Web-only dispatcher for TransactionDetailsModal.
 *
 * On mobile/extension, TransactionDetailsModal is rendered inline by TransactionSummaryLayout
 * when a user taps an activity row. On web, we need the modal to be openable from multiple
 * disconnected surfaces (toast popups, activity tables) without each duplicating modal state.
 *
 * `useOpenTransactionDetailsModal` and the zustand store live in
 * `~/state/transactionDetailsModalStore` so `components/` and `pages/` do not import from
 * `app/layout/TopLevelModals` to open the modal.
 *
 * This file provides:
 *  - `TransactionDetailsModalDispatcher` — mount once via the modal registry
 *
 * The dispatcher renders the shared `TransactionDetailsModal` component and wires up
 * the web-specific success-toast callbacks (report, unhide, copy).
 */
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionDetailsModal } from 'uniswap/src/components/activity/details/TransactionDetailsModal'
import { selectTransactions } from 'uniswap/src/features/transactions/selectors'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useEvent } from 'utilities/src/react/hooks'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { useAppSelector } from '~/state/hooks'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { SelectedTransactionInfo, useTransactionDetailsModalStore } from '~/state/transactionDetailsModalStore'

/**
 * Reads the live transaction from the Redux store so the modal stays in sync
 * when the transaction status updates (e.g. pending → confirmed).
 * Falls back to the snapshot stored in the zustand store if the Redux lookup fails.
 */
function useSyncedSelectedTransaction(): SelectedTransactionInfo | undefined {
  const selected = useTransactionDetailsModalStore((s) => s.selected)
  const address = useWallet().evmAccount?.address
  const allTransactions = useAppSelector(selectTransactions)

  return useMemo(() => {
    if (!selected) {
      return undefined
    }

    const { transaction } = selected
    const chainTxs = address ? allTransactions[address]?.[transaction.chainId] : undefined

    const live = chainTxs?.[transaction.id]
    if (live) {
      return { ...selected, transaction: live }
    }

    // Fallback to the snapshot if the store no longer has it (e.g. cleared)
    return selected
  }, [selected, address, allTransactions])
}

export function TransactionDetailsModalDispatcher(): JSX.Element | null {
  const { t } = useTranslation()
  const synced = useSyncedSelectedTransaction()
  const onClose = useTransactionDetailsModalStore((s) => s.close)

  const onReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-transaction-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const onUnhideTransaction = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Unhide, assetName: t('common.activity') },
      'unhide-transaction-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  const onCopySuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('notification.copied.transactionId') },
      'copy-transaction-id-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

  if (!synced) {
    return null
  }

  return (
    <TransactionDetailsModal
      transactionDetails={synced.transaction}
      isExternalProfile={synced.isExternalProfile}
      onClose={onClose}
      onReportSuccess={onReportSuccess}
      onUnhideTransaction={onUnhideTransaction}
      onCopySuccess={onCopySuccess}
    />
  )
}

export default TransactionDetailsModalDispatcher
