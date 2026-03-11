import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { Warning, WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function TradeWarning({ children, warning }: PropsWithChildren<{ warning: Warning }>): JSX.Element {
  const { t } = useTranslation()

  const isPriceImpactWarning =
    warning.type === WarningLabel.PriceImpactMedium || warning.type === WarningLabel.PriceImpactHigh
  const infoCaption = isPriceImpactWarning ? t('swap.warning.priceImpact.tooltip') : warning.message

  const captionComponent = warning.link ? (
    <Flex gap="$spacing4">
      {infoCaption && (
        <Text variant="body4" color="$neutral2">
          {infoCaption}
        </Text>
      )}
      {warning.link && (
        <LearnMoreLink display="inline" textColor="$neutral1" textVariant="buttonLabel3" url={warning.link} />
      )}
    </Flex>
  ) : undefined

  return (
    <Flex animation="quick" enterStyle={{ opacity: 0 }}>
      <WarningInfo
        modalProps={{
          caption: infoCaption,
          rejectText: t('common.button.close'),
          modalName: ModalName.SwapWarning,
          severity: warning.severity,
          title: warning.title ?? '',
          icon: <AlertTriangleFilled color="$statusCritical" size="$icon.16" />,
        }}
        tooltipProps={{ text: captionComponent ?? '', placement: 'bottom' }}
        trigger={children}
      />
    </Flex>
  )
}
