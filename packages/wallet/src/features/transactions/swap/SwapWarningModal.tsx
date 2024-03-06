import { useTranslation } from 'react-i18next'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { ParsedWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import { ModalName } from 'wallet/src/telemetry/constants'

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
      confirmText={t('common.button.close')}
      icon={Icon && <Icon color={color.text} height={iconSizes.icon24} width={iconSizes.icon24} />}
      modalName={ModalName.SwapWarning}
      severity={warning.severity}
      title={warning.title ?? ''}
      onClose={onClose}
      onConfirm={onClose}
    />
  )
}
