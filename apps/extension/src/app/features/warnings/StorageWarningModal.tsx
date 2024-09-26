import { useTranslation } from 'react-i18next'
import { ONBOARDING_CONTENT_WIDTH } from 'src/app/features/onboarding/utils'
import { useCheckLowStorage } from 'src/app/features/warnings/useCheckLowStorage'
import { AppRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { useExtensionNavigation } from 'src/app/navigation/utils'
import { spacing } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export type StorageWarningModalProps = {
  isOnboarding: boolean
}
export function StorageWarningModal({ isOnboarding }: StorageWarningModalProps): JSX.Element | null {
  const { t } = useTranslation()
  const { navigateTo } = useExtensionNavigation()
  const { showStorageWarning, onStorageWarningClose } = useCheckLowStorage({ isOnboarding })

  return (
    <WarningModal
      caption={t('extension.warning.storage.message')}
      closeText={t('common.button.close')}
      confirmText={isOnboarding ? undefined : t('extension.warning.storage.button')}
      isOpen={showStorageWarning}
      maxWidth={isOnboarding ? ONBOARDING_CONTENT_WIDTH - spacing.spacing16 * 2 : undefined}
      modalName={ModalName.StorageWarning}
      severity={WarningSeverity.High}
      title={t('extension.warning.storage.title')}
      onClose={onStorageWarningClose}
      onConfirm={
        isOnboarding
          ? undefined
          : (): void => {
              onStorageWarningClose()
              navigateTo(`${AppRoutes.Settings}/${SettingsRoutes.ViewRecoveryPhrase}`)
            }
      }
    />
  )
}
