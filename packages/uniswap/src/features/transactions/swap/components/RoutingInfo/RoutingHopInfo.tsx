import type { GasFeeResult } from '@universe/api'
import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, UniswapXText } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { RoutingDiagram } from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/BestRouteTooltip'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { useRoutingEntries, useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'
import { NumberType } from 'utilities/src/format/types'
import { isMobileApp, isWebPlatform } from 'utilities/src/platform'

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

  const caption = useMemo(() => {
    const textVariant = isWebPlatform ? 'body4' : 'body2'
    const textAlign = isWebPlatform ? 'left' : 'center'

    if (isUniswapXTrade) {
      return (
        <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
          <Trans
            i18nKey="uniswapX.aggregatesLiquidity"
            components={{
              logo: (
                <>
                  <UniswapXText variant={textVariant}>UniswapX</UniswapXText>
                </>
              ),
            }}
          />
        </Text>
      )
    }

    if (routes) {
      const descriptionText =
        routingProvider?.getDescription?.(t) ??
        `${gasFeeFormatted ? t('swap.bestRoute.cost', { gasPrice: gasFeeFormatted }) : ''}${t('swap.route.optimizedGasCost')}`

      return (
        <Flex gap="$spacing12">
          <RoutingDiagram
            routes={routes}
            currencyIn={trade.inputAmount.currency}
            currencyOut={trade.outputAmount.currency}
          />
          {descriptionText && (
            <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
              {descriptionText}
            </Text>
          )}
        </Flex>
      )
    }
    return null
  }, [t, trade, routes, gasFeeFormatted, routingProvider, isUniswapXTrade])

  const modalTitle =
    !isUniswapXTrade && routingProvider?.name
      ? t('common.bestRoute.with', { provider: routingProvider.name })
      : t('swap.tradeRoutes')

  const ModalIcon = routingProvider?.icon ?? OrderRouting
  const modalIconColor = routingProvider?.iconColor ?? '$neutral1'

  const mobileLearnMore =
    isMobileApp && !isUniswapXTrade ? (
      <LearnMoreLink textVariant="buttonLabel3" url={uniswapUrls.helpArticleUrls.routingSettings} />
    ) : undefined

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <WarningInfo
        infoButton={mobileLearnMore}
        modalProps={{
          modalName: ModalName.SwapReview,
          captionComponent: caption,
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
            <BestRouteTooltip />
          ) : (
            caption
          ),
          placement: 'top',
          maxWidth: routes ? 300 : undefined,
        }}
        analyticsTitle="Order routing"
      >
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('common.bestRoute')}
          </Text>
        </Flex>
      </WarningInfo>
      <Flex row shrink justifyContent="flex-end">
        <RoutingLabel trade={trade} />
      </Flex>
    </Flex>
  )
}
