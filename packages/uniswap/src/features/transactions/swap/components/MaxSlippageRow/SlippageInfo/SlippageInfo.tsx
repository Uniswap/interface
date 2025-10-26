import { useTranslation } from 'react-i18next'
import { useSporeColors } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { SlippageInfoCaption } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/SlippageInfoCaption'
import type { SlippageInfoProps } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/types'
import { MaxSlippageTooltip } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/MaxSlippageTooltip'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp } from 'utilities/src/platform'

export function SlippageInfo({
  children,
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
}: SlippageInfoProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const priceUxEnabled = usePriceUXEnabled()

  // Avoid showing min out / max in UI when on an indicative quote.
  if (trade.indicative) {
    return <>{children}</>
  }

  const formattedMinimumAmount = `${formatCurrencyAmount({
    amount: trade.minAmountOut,
    locale: 'en-US',
    type: NumberType.TokenTx,
    placeholder: '-',
  })} ${trade.outputAmount.currency.symbol}`

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
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: priceUxEnabled ? (
          <MaxSlippageTooltip
            receivedAmount={formattedMinimumAmount}
            minimumAmount={formattedMinimumAmount}
            autoSlippageEnabled={!isCustomSlippage}
            currentSlippageTolerance={formattedMinimumAmount}
          />
        ) : (
          captionContent
        ),
        maxWidth: priceUxEnabled ? 300 : 272,
        placement: 'top',
      }}
      analyticsTitle="Max Slippage"
    >
      {children}
    </WarningInfo>
  )
}
