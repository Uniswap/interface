import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { LockPreviewImage } from 'src/features/onboarding/LockPreviewImage'
import { Button, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'

export function BackupReminderModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const closedByButtonRef = useRef<boolean>(false)

  const onClose = (): void => {
    dispatch(closeModal({ name: ModalName.BackupReminder }))
  }

  const checkForSwipeToDismiss = (): void => {
    if (!closedByButtonRef.current) {
      // Modal was swiped to dismiss, should open the BackupReminderWarning modal
      dispatch(openModal({ name: ModalName.BackupReminderWarning }))
    }

    // Reset the ref and close the modal
    closedByButtonRef.current = false
    onClose()
  }

  const onPressMaybeLater = (): void => {
    closedByButtonRef.current = true
    dispatch(openModal({ name: ModalName.BackupReminderWarning }))
    onClose()
  }

  const onPressBackup = (): void => {
    closedByButtonRef.current = true
    dispatch(setBackupReminderLastSeenTs(Date.now()))
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.Backup,
      params: { importType: ImportType.BackupOnly, entryPoint: OnboardingEntryPoint.BackupCard },
    })
    onClose()
  }

  return (
    <Modal isModalOpen name={ModalName.BackupReminder} onClose={checkForSwipeToDismiss}>
      <Flex gap="$spacing24" pb="$spacing16" pt="$spacing12" px="$spacing16">
        <LockPreviewImage />
        <Flex alignItems="center" gap="$spacing4">
          <Text variant="subheading1">{t('onboarding.backup.reminder.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('onboarding.backup.reminder.description')}
          </Text>
        </Flex>
        <Flex row gap="$spacing8">
          <Trace logPress element={ElementName.MaybeLaterButton} modal={ModalName.BackupReminder}>
            <Button emphasis="secondary" alignSelf="center" size="medium" onPress={onPressMaybeLater}>
              {t('common.button.later')}
            </Button>
          </Trace>
          <Trace logPress element={ElementName.Continue} modal={ModalName.BackupReminder}>
            <Button variant="branded" alignSelf="center" size="medium" onPress={onPressBackup}>
              {t('common.button.continue')}
            </Button>
          </Trace>
        </Flex>
      </Flex>
    </Modal>
  )
}
