import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapXText, isWeb } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons'
import { colors, opacify } from 'ui/src/theme'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { WarningInfo } from 'wallet/src/components/modals/WarningModal/WarningInfo'
import { WarningTooltipProps } from 'wallet/src/components/modals/WarningModal/WarningTooltipProps'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'

export function UniswapXInfo({
  children,
  tooltipTrigger,
  placement = 'top',
}: PropsWithChildren<{
  tooltipTrigger?: WarningTooltipProps['trigger']
  placement?: WarningTooltipProps['placement']
}>): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink
          textVariant={isWeb ? 'buttonLabel4' : undefined}
          url={uniswapUrls.helpArticleUrls.uniswapXInfo}
        />
      }
      modalProps={{
        backgroundIconColor: opacify(16, colors.uniswapXPurple),
        caption: t('uniswapx.description'),
        closeText: t('common.button.close'),
        icon: <UniswapX size="$icon.24" />,
        modalName: ModalName.UniswapXInfo,
        severity: WarningSeverity.None,
        title: <UniswapXText variant={isWeb ? 'subheading2' : 'body1'}>{t('uniswapx.label')}</UniswapXText>,
      }}
      tooltipProps={{
        text: t('uniswapx.description'),
        placement,
        icon: <UniswapX size="$icon.24" />,
      }}
      trigger={tooltipTrigger}
    >
      {children}
    </WarningInfo>
  )
}
