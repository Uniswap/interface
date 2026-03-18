import type { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { colors, opacify, zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import type { InfoTooltipProps } from 'uniswap/src/components/tooltip/InfoTooltipProps'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isWebPlatform } from 'utilities/src/platform'

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
        <LearnMoreLink
          textVariant={isWebPlatform ? 'body4' : undefined}
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
        titleComponent: (
          <UniswapXText variant={isWebPlatform ? 'subheading2' : 'body1'}>{t('uniswapx.label')}</UniswapXText>
        ),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: t('uniswapx.description'),
        placement,
        icon: <UniswapX size="$icon.24" />,
      }}
      trigger={tooltipTrigger}
      analyticsTitle="UniswapX info"
    >
      {children}
    </WarningInfo>
  )
}
