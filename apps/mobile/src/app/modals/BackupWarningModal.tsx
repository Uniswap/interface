import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'

export function BackupWarningModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const closedByButtonRef = useRef<boolean>(false)

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.BackupReminderWarning }))
  }

  const checkForSwipeToDismiss = (): void => {
    if (!closedByButtonRef.current) {
      // Modal was swiped to dismiss, should set backup reminder timestamp
      dispatch(setBackupReminderLastSeenTs(Date.now()))
    }

    // Reset the ref and close the modal
    closedByButtonRef.current = false
    onClose()
  }

  const openBackupReminderModal = (): void => {
    closedByButtonRef.current = true
    dispatch(openModal({ name: ModalName.BackupReminder }))
    onClose()
  }

  const onConfirm = (): void => {
    closedByButtonRef.current = true
    dispatch(setBackupReminderLastSeenTs(Date.now()))
    onClose()
  }

  return (
    <WarningModal
      isOpen
      caption={t('onboarding.backup.reminder.warning.description')}
      closeText={t('common.button.back')}
      confirmText={t('common.button.understand')}
      modalName={ModalName.BackupReminderWarning}
      severity={WarningSeverity.High}
      title={t('onboarding.backup.reminder.warning.title')}
      onCancel={openBackupReminderModal}
      onClose={checkForSwipeToDismiss}
      onConfirm={onConfirm}
    />
  )
}
