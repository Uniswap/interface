import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapXText, isWeb } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { colors, opacify } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export function UniswapXInfo({
  children,
  tooltipTrigger,
  placement = 'top',
}: PropsWithChildren<{
  tooltipTrigger?: InfoTooltipProps['trigger']
  placement?: InfoTooltipProps['placement']
}>): JSX.Element {
  const { t } = useTranslation()

  return (
    <WarningInfo
      infoButton={
        <LearnMoreLink textVariant={isWeb ? 'body4' : undefined} url={uniswapUrls.helpArticleUrls.uniswapXInfo} />
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
