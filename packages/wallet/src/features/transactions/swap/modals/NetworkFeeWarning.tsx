import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { isWeb, useSporeColors } from 'ui/src'
import { Gas } from 'ui/src/components/icons'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'
import { LearnMoreLink } from 'wallet/src/components/text/LearnMoreLink'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { ModalName } from 'wallet/src/telemetry/constants'

export function NetworkFeeWarning({
  gasFeeHighRelativeToValue,
  children,
  tooltipTrigger,
  placement = 'top',
}: PropsWithChildren<{
  gasFeeHighRelativeToValue?: boolean
  tooltipTrigger?: WarningTooltipProps['trigger']
  placement?: WarningTooltipProps['placement']
}>): JSX.Element {
  const colors = useSporeColors()
  const { t } = useTranslation()

  const text = gasFeeHighRelativeToValue
    ? t('swap.warning.networkFee.highRelativeToValue')
    : t('swap.warning.networkFee.message')

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel4' : undefined}
          url={uniswapUrls.helpArticleUrls.networkFeeInfo}
        />
      }
      modalProps={{
        backgroundIconColor: colors.surface2.get(),
        caption: text,
        closeText: t('common.button.close'),
        icon: (
          <Gas
            color={gasFeeHighRelativeToValue ? '$statusCritical' : '$neutral2'}
            size="$icon.24"
          />
        ),
        modalName: ModalName.NetworkFeeInfo,
        severity: WarningSeverity.None,
        title: t('transaction.networkCost.label'),
      }}
      tooltipProps={{
        text,
        placement,
        icon: gasFeeHighRelativeToValue ? <Gas color="$statusCritical" size="$icon.16" /> : null,
      }}
      trigger={tooltipTrigger}>
      {children}
    </WarningInfo>
  )
}
