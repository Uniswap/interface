import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SlippageInfoCaption } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/SlippageInfo/SlippageInfoCaption'
import { SlippageInfoProps } from 'uniswap/src/features/transactions/swap/review/MaxSlippageRow/SlippageInfo/types'
import { isMobileApp } from 'utilities/src/platform'

export function SlippageInfo({
  children,
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
}: SlippageInfoProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()

  // Avoid showing min out / max in UI when on an indicative quote.
  if (trade.indicative) {
    return <>{children}</>
  }

  const captionContent = (
    <SlippageInfoCaption
      trade={trade}
      isCustomSlippage={isCustomSlippage}
      autoSlippageTolerance={autoSlippageTolerance}
    />
  )

  return (
    <WarningInfo
      infoButton={isMobileApp ? <LearnMoreLink url={uniswapUrls.helpArticleUrls.swapSlippage} /> : null}
      modalProps={{
        backgroundIconColor: colors.surface2.get(),
        captionComponent: captionContent,
        rejectText: t('common.button.close'),
        icon: <Settings color="$neutral2" size="$icon.28" />,
        modalName: ModalName.SlippageInfo,
        severity: WarningSeverity.None,
        title: t('swap.slippage.settings.title'),
      }}
      tooltipProps={{
        text: captionContent,
        maxWidth: 272,
        placement: 'top',
      }}
    >
      {children}
    </WarningInfo>
  )
}
