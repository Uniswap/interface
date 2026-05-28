import { useTranslation } from 'react-i18next'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function ScreenshotWarningModal({ route }: AppStackScreenProp<typeof ModalName.ScreenshotWarning>): JSX.Element {
  const { t } = useTranslation()
  const { onClose } = useReactNavigationModal()
  const acknowledgeText = route.params?.acknowledgeText

  return (
    <WarningModal
      isOpen
      caption={t('onboarding.recoveryPhrase.warning.screenshot.message')}
      acknowledgeText={acknowledgeText ?? t('common.button.ok')}
      modalName={ModalName.ScreenshotWarning}
      title={t('onboarding.recoveryPhrase.warning.screenshot.title')}
      onAcknowledge={onClose}
      onClose={onClose}
    />
  )
}
