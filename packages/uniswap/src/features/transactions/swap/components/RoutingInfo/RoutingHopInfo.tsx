import type { GasFeeResult } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { isMobileApp } from '@universe/environment'
import { zIndexes } from '@universe/mycelium'
import {
  BestRouteLabel,
  infoBodyTextVariant,
  type InfoContainer,
  RoutingCaption,
  type RoutingCaptionDisplay,
  RoutingCaptionKind,
  RoutingInfoRow,
} from '@universe/swap-ui'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Trans, UniswapXText } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { RoutingDiagram } from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/BestRouteTooltip'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { summarizeSwapSteps } from 'uniswap/src/utils/routingDiagram/routingProviders/uniswapRoutingProvider'
import { useRoutingEntries, useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'
import { NumberType } from 'utilities/src/format/types'

/** Adapter for the classic/UniswapX routing row: derives the caption display and owns the info shell. */
export function RoutingHopInfo({
  trade,
  chainId,
  gasFee,
}: PropsWithChildren<{
  trade: Trade
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.displayValue ?? undefined)
  const gasFeeFormatted =
    gasFeeUSD !== undefined ? convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice) : undefined

  const routes = useRoutingEntries({ trade })
  const routingProvider = useRoutingProvider({ routing: trade.routing })
  const isUniswapXTrade = isUniswapX(trade)

  const swapStepsSummary = useMemo(() => {
    const steps = isClassic(trade) ? trade.quote.quote.swapSteps : undefined
    if (!steps?.length) {
      return undefined
    }
    const { pools, versions } = summarizeSwapSteps(steps)
    if (pools <= 0 || versions.length === 0) {
      return undefined
    }
    return { pools, versions }
  }, [trade])

  const routeCaption = useMemo((): RoutingCaptionDisplay | undefined => {
    // Prefer the classic `route` object diagram whenever it's available (Uniroute sends both
    // `route` and `swapSteps`); fall back to the swapSteps text summary only when the route
    // object is absent (e.g. GuideStar quotes).
    if (routes && routes.length > 0) {
      const descriptionText =
        routingProvider?.getDescription?.(t) ??
        `${gasFeeFormatted ? t('swap.bestRoute.cost', { gasPrice: gasFeeFormatted }) : ''}${t('swap.route.optimizedGasCost')}`
      return {
        kind: RoutingCaptionKind.Diagram,
        diagram: (
          <RoutingDiagram
            routes={routes}
            currencyIn={trade.inputAmount.currency}
            currencyOut={trade.outputAmount.currency}
          />
        ),
        descriptionText,
      }
    }

    if (swapStepsSummary) {
      return {
        kind: RoutingCaptionKind.PoolsSummary,
        pools: swapStepsSummary.pools,
        versions: swapStepsSummary.versions,
      }
    }
    return undefined
  }, [t, trade, routes, gasFeeFormatted, routingProvider, swapStepsSummary])

  // Rendered once per shell slot. The UniswapX sentence is built here because its gradient word
  // has to match the body text size of the shell it lands in.
  const renderCaption = (container: InfoContainer): JSX.Element | null => {
    const caption: RoutingCaptionDisplay | undefined = isUniswapXTrade
      ? {
          kind: RoutingCaptionKind.UniswapX,
          content: (
            <Trans
              i18nKey="uniswapX.aggregatesLiquidity"
              components={{
                logo: <UniswapXText variant={infoBodyTextVariant(container)}>UniswapX</UniswapXText>,
              }}
            />
          ),
        }
      : routeCaption
    return caption ? <RoutingCaption container={container} caption={caption} /> : null
  }

  const modalTitle =
    !isUniswapXTrade && routingProvider?.name
      ? t('common.bestRoute.with', { provider: routingProvider.name })
      : t('swap.tradeRoutes')

  const ModalIcon = routingProvider?.icon ?? OrderRouting
  const modalIconColor = routingProvider?.iconColor ?? '$neutral1'

  // BestRouteTooltip embeds its own learn-more link, so only add one when it isn't shown
  const learnMoreLink =
    !isUniswapXTrade && (isMobileApp || !routes || routes.length === 0) ? (
      <LearnMoreLink textVariant="buttonLabel4" textColor="$neutral1" url={UniswapHelpUrls.articles.routingSettings} />
    ) : undefined

  return (
    <RoutingInfoRow
      info={
        <WarningInfo
          infoButton={learnMoreLink}
          modalProps={{
            modalName: ModalName.SwapReview,
            captionComponent: renderCaption('modal'),
            rejectText: t('common.button.close'),
            icon: <ModalIcon color={modalIconColor} size="$icon.48" />,
            backgroundIconColor: false,
            severity: WarningSeverity.None,
            title: modalTitle,
            zIndex: zIndexes.popover,
          }}
          tooltipProps={{
            text: isUniswapXTrade ? (
              <BestRouteUniswapXTooltip />
            ) : routes && routes.length > 0 ? (
              <BestRouteTooltip trade={trade} />
            ) : (
              renderCaption('tooltip')
            ),
            placement: 'top',
            maxWidth: isUniswapXTrade || (routes && routes.length > 0) ? 300 : undefined,
          }}
          analyticsTitle="Order routing"
        >
          <BestRouteLabel />
        </WarningInfo>
      }
      label={<RoutingLabel trade={trade} />}
    />
  )
}
