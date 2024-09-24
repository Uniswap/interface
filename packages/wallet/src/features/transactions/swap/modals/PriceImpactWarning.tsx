import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertTriangleFilled } from 'ui/src/components/icons'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { Warning } from 'uniswap/src/features/transactions/WarningModal/types'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'

export function PriceImpactWarning({ children, warning }: PropsWithChildren<{ warning: Warning }>): JSX.Element {
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
        icon: <AlertTriangleFilled color="$statusCritical" size="$icon.16" />,
      }}
      tooltipProps={{ text: caption ?? '', placement: 'bottom' }}
      trigger={children}
    />
  )
}
