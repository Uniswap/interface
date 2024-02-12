import { useTranslation } from 'react-i18next'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'src/features/telemetry/constants'
import { ParsedWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { iconSizes } from 'ui/src/theme'

export function SwapWarningModal({
  onClose,
  parsedWarning,
}: {
  onClose: () => void
  parsedWarning: Required<ParsedWarnings>['reviewScreenWarning']
}): JSX.Element {
  const { t } = useTranslation()

  const { warning, Icon, color } = parsedWarning

  return (
    <WarningModal
      caption={warning.message}
      confirmText={t('Close')}
      icon={Icon && <Icon color={color.text} height={iconSizes.icon24} width={iconSizes.icon24} />}
      modalName={ModalName.SwapWarning}
      severity={warning.severity}
      title={warning.title ?? ''}
      onClose={onClose}
      onConfirm={onClose}
    />
  )
}
