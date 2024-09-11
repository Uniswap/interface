import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Experiments, OnboardingRedesignRecoveryBackupProperties } from 'uniswap/src/features/gating/experiments'
import { useExperimentValueWithExposureLoggingDisabled } from 'uniswap/src/features/gating/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSelectAddressTransactions } from 'uniswap/src/features/transactions/selectors'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import {
  selectBackupReminderLastSeenTs,
  selectCreatedOnboardingRedesignAccount,
} from 'wallet/src/features/behaviorHistory/selectors'
import { Account } from 'wallet/src/features/wallet/accounts/types'

export function useOpenBackupReminderModal(activeAccount: Account): void {
  const dispatch = useDispatch()
  const txns = useSelectAddressTransactions(activeAccount.address)
  const { isOpen: isBackupReminderModalOpen } = useSelector(selectModalState(ModalName.BackupReminder))
  const backupReminderLastSeenTs = useSelector(selectBackupReminderLastSeenTs)

  const createdOnboardingRedesignAccount = useSelector(selectCreatedOnboardingRedesignAccount)
  const onboardingBackupExperimentEnabled = useExperimentValueWithExposureLoggingDisabled(
    Experiments.OnboardingRedesignRecoveryBackup,
    OnboardingRedesignRecoveryBackupProperties.Enabled,
    false,
  )
  const enableReminder = createdOnboardingRedesignAccount && onboardingBackupExperimentEnabled

  const backupReminderOpenDelaySec = useExperimentValueWithExposureLoggingDisabled(
    Experiments.OnboardingRedesignRecoveryBackup,
    OnboardingRedesignRecoveryBackupProperties.BackupReminderDelaySecs,
    0, // Defaulting to 0 seconds delay
    (x): x is number => typeof x === 'number',
  )

  const isSignerAccount = activeAccount.type === AccountType.SignerMnemonic
  const shouldOpenBackupReminderModal =
    !isBackupReminderModalOpen && isSignerAccount && !!txns && !activeAccount.backups

  useEffect(() => {
    if (!enableReminder) {
      return
    }

    if (shouldOpenBackupReminderModal && onboardingBackupExperimentEnabled && backupReminderLastSeenTs === undefined) {
      // Get the min addedTime from the transactions (i.e. the user's first transaction)
      const minAddedTime = Math.min(...txns.map((txn) => txn.addedTime))
      const delayMs = backupReminderOpenDelaySec * ONE_SECOND_MS
      const remainingTimeMs = Math.max(minAddedTime + delayMs - Date.now(), 0)
      const timeoutId = setTimeout(() => {
        dispatch(openModal({ name: ModalName.BackupReminder }))
      }, remainingTimeMs)

      return () => clearTimeout(timeoutId)
    }
  }, [
    dispatch,
    shouldOpenBackupReminderModal,
    backupReminderLastSeenTs,
    txns,
    enableReminder,
    onboardingBackupExperimentEnabled,
    backupReminderOpenDelaySec,
  ])
}
