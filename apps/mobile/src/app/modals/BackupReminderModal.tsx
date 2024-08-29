import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { closeModal } from 'src/features/modals/modalSlice'
import { LockPreviewImage } from 'src/features/onboarding/LockPreviewImage'
import { Button, Flex, Text } from 'ui/src'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningSeverity } from 'uniswap/src/features/transactions/WarningModal/types'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { setBackupReminderLastSeenTs } from 'wallet/src/features/behaviorHistory/slice'

export function BackupReminderModal(): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const [isShowingWarningModal, setIsShowingWarningModal] = useState(false)

  const showWarningModal = (): void => {
    setIsShowingWarningModal(true)
  }

  const hideWarningModal = (): void => {
    setIsShowingWarningModal(false)
  }

  const onClose = (): void => {
    dispatch(setBackupReminderLastSeenTs(Date.now()))
    dispatch(closeModal({ name: ModalName.BackupReminder }))
  }

  const onPressBackup = (): void => {
    navigate(MobileScreens.OnboardingStack, {
      screen: OnboardingScreens.Backup,
      params: { importType: ImportType.BackupOnly, entryPoint: OnboardingEntryPoint.BackupCard },
    })
    onClose()
  }

  return !isShowingWarningModal ? (
    <Modal name={ModalName.BackupReminder} onClose={showWarningModal}>
      <Flex gap="$spacing24" pb="$spacing16" pt="$spacing12" px="$spacing16">
        <LockPreviewImage />
        <Flex alignItems="center" gap="$spacing4">
          <Text variant="subheading1">{t('onboarding.backup.reminder.title')}</Text>
          <Text color="$neutral2" textAlign="center" variant="body3">
            {t('onboarding.backup.reminder.description')}
          </Text>
        </Flex>
        <Flex row gap="$spacing8">
          <Button
            alignSelf="center"
            color="$neutral2"
            flex={1}
            size="medium"
            theme="secondary"
            onPress={showWarningModal}
          >
            {t('common.button.later')}
          </Button>
          <Button alignSelf="center" flex={1} size="medium" theme="primary" onPress={onPressBackup}>
            {t('common.button.continue')}
          </Button>
        </Flex>
      </Flex>
    </Modal>
  ) : (
    <WarningModal
      caption={t('onboarding.backup.reminder.warning.description')}
      closeText={t('common.button.back')}
      confirmText={t('common.button.understand')}
      isOpen={isShowingWarningModal}
      modalName={ModalName.BackupReminderWarning}
      severity={WarningSeverity.High}
      title={t('onboarding.backup.reminder.warning.title')}
      onCancel={hideWarningModal}
      onClose={onClose}
      onConfirm={onClose}
    />
  )
}
