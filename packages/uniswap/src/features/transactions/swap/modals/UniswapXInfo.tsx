import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapXText, isWeb } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { colors, opacify } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningTooltipProps } from 'uniswap/src/components/modals/WarningModal/WarningTooltipProps'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

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
          textVariant={isWeb ? 'buttonLabel3' : undefined}
          url={uniswapUrls.helpArticleUrls.uniswapXInfo}
        />
      }
      modalProps={{
        backgroundIconColor: opacify(16, colors.uniswapXPurple),
        caption: t('uniswapx.description'),
        rejectText: t('common.button.close'),
        icon: <UniswapX size="$icon.24" />,
        modalName: ModalName.UniswapXInfo,
        severity: WarningSeverity.None,
        titleComponent: <UniswapXText variant={isWeb ? 'subheading2' : 'body1'}>{t('uniswapx.label')}</UniswapXText>,
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
