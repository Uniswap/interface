import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangle } from 'ui/src/components/icons'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { Warning } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export function PriceImpactWarning({
  children,
  warning,
}: PropsWithChildren<{ warning: Warning }>): JSX.Element {
  const { t } = useTranslation()

  const caption = warning.message

  return (
    <WarningInfo
      modalProps={{
        caption,
        closeText: t('common.button.close'),
        modalName: ModalName.SwapWarning,
        severity: warning.severity,
        title: warning.title ?? '',
        icon: <AlertTriangle color="$statusCritical" size="$icon.16" />,
      }}
      tooltipProps={{ text: caption ?? '', placement: 'bottom' }}
      trigger={children}
    />
  )
}
