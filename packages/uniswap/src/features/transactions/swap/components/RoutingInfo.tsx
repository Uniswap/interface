import type { PropsWithChildren } from 'react'
import { useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, UniswapXText } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { zIndexes } from 'ui/src/theme'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { RoutingDiagram } from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import type { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AcrossRoutingInfo } from 'uniswap/src/features/transactions/swap/components/AcrossRoutingInfo'
import {
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/BestRouteTooltip'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { isBridge, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { openUri } from 'uniswap/src/utils/linking'
import { useRoutingEntries } from 'uniswap/src/utils/routingDiagram/routingRegistry'
import { NumberType } from 'utilities/src/format/types'
import { isWebPlatform } from 'utilities/src/platform'

export function RoutingInfo({
  trade,
  chainId,
  gasFee,
}: PropsWithChildren<{
  trade: Trade
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  if (isBridge(trade)) {
    return <AcrossRoutingInfo />
  }

  return <RoutingInfoInternal trade={trade} chainId={chainId} gasFee={gasFee} />
}

function RoutingInfoInternal({
  trade,
  chainId,
  gasFee,
}: PropsWithChildren<{
  trade: Trade
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  const priceUxEnabled = usePriceUXEnabled()
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.displayValue ?? undefined)
  const gasFeeFormatted =
    gasFeeUSD !== undefined ? convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice) : undefined

  const routes = useRoutingEntries({ trade })

  const v4SwapEnabled = useV4SwapEnabled(chainId)
  const isMaybeV4 = v4SwapEnabled && isClassic(trade)

  const caption = useMemo(() => {
    const textVariant = isWebPlatform ? 'body4' : 'body2'
    const textAlign = isWebPlatform ? 'left' : 'center'

    if (isUniswapX(trade)) {
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
      return (
        <Flex gap="$spacing12">
          {isWebPlatform && (
            <RoutingDiagram
              routes={routes}
              currencyIn={trade.inputAmount.currency}
              currencyOut={trade.outputAmount.currency}
            />
          )}
          <Text variant={textVariant} textAlign={textAlign} color="$neutral2">
            {gasFeeFormatted && t('swap.bestRoute.cost', { gasPrice: gasFeeFormatted })}
            {t('swap.route.optimizedGasCost')}
          </Text>
        </Flex>
      )
    }
    return null
  }, [t, trade, routes, gasFeeFormatted])

  const InfoButton = useMemo(() => {
    if (!isMaybeV4 && !isUniswapX(trade)) {
      return null
    }

    const helpCenterUrl = uniswapUrls.helpArticleUrls.routingSettings

    return (
      <TouchableArea
        onPress={async () => {
          await openUri({ uri: helpCenterUrl })
        }}
      >
        <Text color="$accent1" variant={isWebPlatform ? 'body4' : 'buttonLabel2'}>
          {t('common.button.learn')}
        </Text>
      </TouchableArea>
    )
  }, [t, trade, isMaybeV4])

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <WarningInfo
        infoButton={priceUxEnabled ? null : InfoButton}
        modalProps={{
          modalName: ModalName.SwapReview,
          captionComponent: caption,
          rejectText: t('common.button.close'),
          icon: <OrderRouting color="$neutral1" size="$icon.24" />,
          severity: WarningSeverity.None,
          title: t('swap.tradeRoutes'),
          zIndex: zIndexes.popover,
        }}
        tooltipProps={{
          text: priceUxEnabled ? (
            isUniswapX(trade) ? (
              <BestRouteUniswapXTooltip />
            ) : routes ? (
              <BestRouteTooltip />
            ) : (
              caption
            )
          ) : (
            caption
          ),
          placement: 'top',
          maxWidth: priceUxEnabled ? 300 : routes ? 400 : undefined,
        }}
        analyticsTitle="Order routing"
      >
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {priceUxEnabled ? t('common.bestRoute') : t('swap.orderRouting')}
          </Text>
        </Flex>
      </WarningInfo>
      <Flex row shrink justifyContent="flex-end">
        <RoutingLabel trade={trade} />
      </Flex>
    </Flex>
  )
}
