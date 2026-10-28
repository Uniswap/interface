import { TradeType } from '@uniswap/sdk-core'
import { isMobileApp } from '@universe/environment'
import { zIndexes } from '@universe/mycelium'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { SlippageInfoCaption, type SlippageInfoCaptionProps } from '@universe/swap-ui'
import { useTranslation } from 'react-i18next'
import { Settings } from 'ui/src/components/icons/Settings'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo, type WarningInfoShell } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import type { SlippageInfoProps } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/types'
import { useFormatSlippageAmount } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/useFormatSlippageAmount'
import { isChained } from 'uniswap/src/features/transactions/swap/utils/routing'

/** Shell adapter: owns the tooltip/modal and maps the trade onto the swap-ui SlippageInfoCaption. */
export function SlippageInfo({
  children,
  trade,
  isCustomSlippage,
  autoSlippageTolerance,
}: SlippageInfoProps): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { formatPercent } = useLocalizationContext()
  // Hooks stay above the indicative early return; the caption used to mount them only for full quotes.
  const formattedSlippageAmount = useFormatSlippageAmount(trade.indicative ? null : trade)

  // Avoid showing min out / max in UI when on an indicative quote.
  if (trade.indicative) {
    return <>{children}</>
  }

  const { slippageTolerance, tradeType } = trade
  const showSlippageWarning = Boolean(autoSlippageTolerance && slippageTolerance > autoSlippageTolerance)

  // For chained actions, slippage is applied per step, not as a total.
  // This means compound slippage can exceed what the user set (e.g. 6% per step → 11.64% total for 2 steps).
  // We show an explanatory message when the user has set custom slippage so they understand this behavior.
  const isChainedTrade = isChained(trade)
  const swapStepCount = isChainedTrade
    ? (trade.quote.quote.steps?.filter((s) => s.slippage !== undefined).length ?? 0)
    : 0
  const showChainedMessage = isChainedTrade && isCustomSlippage && swapStepCount > 1

  const captionProps: Omit<SlippageInfoCaptionProps, 'container'> = {
    isExactInput: [TradeType.EXACT_INPUT, 'EXACT_INPUT'].includes(tradeType),
    slippage: {
      tolerance: formatPercent(slippageTolerance),
      isZero: slippageTolerance === 0,
      isCustom: isCustomSlippage,
      exceedsAuto: showSlippageWarning,
    },
    slippageAmount: formattedSlippageAmount,
    showChainedMessage,
    chainedStepCount: swapStepCount,
  }

  // The tooltip body carries its own inline link; the modal gets the standalone button.
  const renderModalLearnMore = (shell: WarningInfoShell): JSX.Element | null =>
    shell === 'modal' ? <LearnMoreLink textColor="$neutral1" url={UniswapHelpUrls.articles.swapSlippage} /> : null

  return (
    <WarningInfo
      infoButton={renderModalLearnMore}
      modalProps={{
        backgroundIconColor: colors.surface2.get(),
        captionComponent: (
          <SlippageInfoCaption {...captionProps} container="modal" showToleranceSummary={isMobileApp} />
        ),
        rejectText: t('common.button.close'),
        icon: <Settings color="$neutral2" size="$icon.28" />,
        modalName: ModalName.SlippageInfo,
        severity: WarningSeverity.None,
        title: t('swap.slippage.settings.title'),
        zIndex: zIndexes.popover,
      }}
      tooltipProps={{
        text: (
          <SlippageInfoCaption
            {...captionProps}
            container="tooltip"
            learnMoreLink={
              <LearnMoreLink url={UniswapHelpUrls.articles.swapSlippage} textVariant="body4" textColor="$neutral1" />
            }
          />
        ),
        maxWidth: 272,
        placement: 'top',
      }}
      analyticsTitle="Max Slippage"
    >
      {children}
    </WarningInfo>
  )
}
