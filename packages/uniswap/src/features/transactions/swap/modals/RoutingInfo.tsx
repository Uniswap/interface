import { PropsWithChildren, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, UniswapXText, isWeb, useSporeColors } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { RouterLabel } from 'uniswap/src/components/RouterLabel/RouterLabel'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'
import { openUri } from 'uniswap/src/utils/linking'

import { NumberType } from 'utilities/src/format/types'

export function RoutingInfo({
  chainId,
  gasFee,
}: PropsWithChildren<{
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  const colors = useSporeColors()
  const { t } = useTranslation()
  const { trade } = useSwapTxContext()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.displayValue ?? undefined)
  const gasFeeFormatted =
    gasFeeUSD !== undefined ? convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice) : undefined

  const routes = useMemo(() => (trade && isClassic(trade) ? getRoutingDiagramEntries(trade) : []), [trade])

  const v4SwapEnabled = useV4SwapEnabled(chainId)
  const isMaybeV4 = trade && v4SwapEnabled && isClassic(trade)

  const caption = useMemo(() => {
    if (!trade) {
      return null
    }

    const textVariant = isWeb ? 'body4' : 'body2'
    const textAlign = isWeb ? 'left' : 'center'

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

    if (isClassic(trade)) {
      return (
        <Flex gap="$spacing12">
          {isWeb && (
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
    if (!trade) {
      return null
    }
    if (!isMaybeV4 && !isUniswapX(trade)) {
      return null
    }

    const helpCenterUrl = uniswapUrls.helpArticleUrls.routingSettings

    return (
      <TouchableArea
        onPress={async () => {
          await openUri(helpCenterUrl)
        }}
      >
        <Text color="$accent1" variant={isWeb ? 'body4' : 'buttonLabel2'}>
          {t('common.button.learn')}
        </Text>
      </TouchableArea>
    )
  }, [t, trade, isMaybeV4])

  return (
    <Flex row alignItems="center" justifyContent="space-between">
      <WarningInfo
        infoButton={InfoButton}
        modalProps={{
          modalName: ModalName.SwapReview,
          captionComponent: caption,
          rejectText: t('common.button.close'),
          icon: <OrderRouting color={colors.neutral1.val} size={24} />,
          severity: WarningSeverity.None,
          title: t('swap.tradeRoutes'),
        }}
        tooltipProps={{ text: caption, placement: 'top', maxWidth: trade && isClassic(trade) ? 400 : undefined }}
      >
        <Flex centered row gap="$spacing4">
          <Text color="$neutral2" variant="body3">
            {t('swap.orderRouting')}
          </Text>
        </Flex>
      </WarningInfo>
      <Flex row shrink justifyContent="flex-end">
        <Text adjustsFontSizeToFit color="$neutral1" variant="body3">
          <RouterLabel />
        </Text>
      </Flex>
    </Flex>
  )
}
