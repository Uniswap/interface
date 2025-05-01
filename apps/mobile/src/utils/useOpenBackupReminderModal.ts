import { useNavigation } from '@react-navigation/native'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { selectBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/selectors'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { hasExternalBackup } from 'wallet/src/features/wallet/accounts/utils'

const BACKUP_REMINDER_DELAY_MS = 20 * ONE_SECOND_MS
const BACKUP_REMINDER_MIN_TIMEOUT_MS = 2 * ONE_SECOND_MS

export function useOpenBackupReminderModal(activeAccount: Account): void {
  const dispatch = useDispatch()
  const txns = useSelectAddressTransactions(activeAccount.address)
  const navigation = useNavigation()

  const isBackupReminderModalOpen = navigation
    .getState()
    .routes.some((route) => route.name === ModalName.BackupReminder)
  const isBackupReminderWarningModalOpen = navigation
    .getState()
    .routes.some((route) => route.name === ModalName.BackupReminderWarning)

  const backupReminderLastSeenTs = useSelector(selectBackupReminderLastSeenTs)
  const externalBackups = hasExternalBackup(activeAccount)

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const shouldOpenBackupReminderModal =
    !isBackupReminderModalOpen &&
    !isBackupReminderWarningModalOpen &&
    isSignerAccount &&
    !!txns?.length &&
    !externalBackups

  useEffect(() => {
    if (shouldOpenBackupReminderModal && backupReminderLastSeenTs === undefined) {
      // Get the min addedTime from the transactions (i.e. the user's first transaction)
      const minAddedTime = Math.min(...txns.map((txn) => txn.addedTime))
      const remainingTimeMs = Math.max(
        minAddedTime + BACKUP_REMINDER_DELAY_MS - Date.now(),
        BACKUP_REMINDER_MIN_TIMEOUT_MS,
      )
      const timeoutId = setTimeout(() => {
        navigation.navigate(ModalName.BackupReminder as never)
      }, remainingTimeMs)

      return () => clearTimeout(timeoutId)
    }

    return undefined
  }, [dispatch, shouldOpenBackupReminderModal, backupReminderLastSeenTs, txns, navigation])
}
