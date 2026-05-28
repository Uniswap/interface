import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { Warning } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function TradeWarning({ children, warning }: PropsWithChildren<{ warning: Warning }>): JSX.Element {
  const { t } = useTranslation()

  const caption = warning.message

  return (
    <Flex animation="quick" enterStyle={{ opacity: 0 }}>
      <WarningInfo
        modalProps={{
          caption,
          rejectText: t('common.button.close'),
          modalName: ModalName.SwapWarning,
          severity: warning.severity,
          title: warning.title ?? '',
          icon: <AlertTriangleFilled color="$statusCritical" size="$icon.16" />,
        }}
        tooltipProps={{ text: caption ?? '', placement: 'bottom' }}
        trigger={children}
      />
    </Flex>
  )
}
