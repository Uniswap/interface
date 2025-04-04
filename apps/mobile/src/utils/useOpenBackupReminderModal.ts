import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/selectors'
import { Account } from 'wallet/src/features/wallet/accounts/types'

const BACKUP_REMINDER_DELAY_MS = 20 * ONE_SECOND_MS
const BACKUP_REMINDER_MIN_TIMEOUT_MS = 2 * ONE_SECOND_MS

export function useOpenBackupReminderModal(activeAccount: Account): void {
  const dispatch = useDispatch()
  const txns = useSelectAddressTransactions(activeAccount.address)
  const { isOpen: isBackupReminderModalOpen } = useSelector(selectModalState(ModalName.BackupReminder))
  const { isOpen: isBackupReminderWarningModalOpen } = useSelector(selectModalState(ModalName.BackupReminderWarning))
  const backupReminderLastSeenTs = useSelector(selectBackupReminderLastSeenTs)

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const shouldOpenBackupReminderModal =
    !isBackupReminderModalOpen &&
    !isBackupReminderWarningModalOpen &&
    isSignerAccount &&
    !!txns?.length &&
    !activeAccount.backups

  useEffect(() => {
    if (shouldOpenBackupReminderModal && backupReminderLastSeenTs === undefined) {
      // Get the min addedTime from the transactions (i.e. the user's first transaction)
      const minAddedTime = Math.min(...txns.map((txn) => txn.addedTime))
      const remainingTimeMs = Math.max(
        minAddedTime + BACKUP_REMINDER_DELAY_MS - Date.now(),
        BACKUP_REMINDER_MIN_TIMEOUT_MS,
      )
      const timeoutId = setTimeout(() => {
        dispatch(openModal({ name: ModalName.BackupReminder }))
      }, remainingTimeMs)

      return () => clearTimeout(timeoutId)
    }

    return undefined
  }, [dispatch, shouldOpenBackupReminderModal, backupReminderLastSeenTs, txns])
}
