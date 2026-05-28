import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ElementName, ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'

export function BackupWarningModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const closedByButtonRef = useRef<boolean>(false)
  const { onClose } = useReactNavigationModal()

  const checkForSwipeToDismiss = (): void => {
    const markReminderAsSeen = !closedByButtonRef.current
    if (markReminderAsSeen) {
      // Modal was swiped to dismiss, should set backup reminder timestamp
      dispatch(setBackupReminderLastSeenTs(Date.now()))
    }

    sendAnalyticsEvent(WalletEventName.ModalClosed, {
      element: ElementName.BackButton,
      modal: ModalName.BackupReminderWarning,
      markReminderAsSeen,
    })

    // Reset the ref and close the modal
    closedByButtonRef.current = false
    onClose()
  }

  const openBackupReminderModal = (): void => {
    closedByButtonRef.current = true
    onClose()
    navigate(ModalName.BackupReminder)
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
      rejectText={t('common.button.back')}
      acknowledgeText={t('common.button.understand')}
      modalName={ModalName.BackupReminderWarning}
      severity={WarningSeverity.High}
      title={t('onboarding.backup.reminder.warning.title')}
      onReject={openBackupReminderModal}
      onClose={checkForSwipeToDismiss}
      onAcknowledge={onConfirm}
    />
  )
}
