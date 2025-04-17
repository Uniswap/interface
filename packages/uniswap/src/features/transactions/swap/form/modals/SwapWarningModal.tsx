import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ParsedWarnings } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function SwapWarningModal({
  isOpen,
  onClose,
  parsedWarning,
}: {
  isOpen: boolean
  onClose: () => void
  parsedWarning: Required<ParsedWarnings>['reviewScreenWarning']
}): JSX.Element {
  const { t } = useTranslation()

  const { warning, Icon, color } = parsedWarning

  return (
    <WarningModal
      caption={warning.message}
      acknowledgeText={t('common.button.close')}
      icon={Icon && <Icon color={color.text} size={iconSizes.icon24} />}
      isOpen={isOpen}
      modalName={ModalName.SwapWarning}
      severity={warning.severity}
      title={warning.title ?? ''}
      onClose={onClose}
      onAcknowledge={onClose}
    />
  )
}
