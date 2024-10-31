import { t } from 'i18next'
import { PropsWithChildren, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { Flex, Text, TouchableArea, UniswapXText, isWeb } from 'ui/src'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { GasFeeResult } from 'uniswap/src/features/gas/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { UniverseChainId } from 'uniswap/src/types/chains'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'
import { openUri } from 'uniswap/src/utils/linking'

import { NumberType } from 'utilities/src/format/types'

export function RoutingInfo({
  chainId,
  gasFee,
  children,
}: PropsWithChildren<{
  chainId: UniverseChainId
  gasFee: GasFeeResult
}>): JSX.Element | null {
  const { trade } = useSwapTxContext()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.value ?? undefined)
  const gasFeeFormatted = convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice)

  const routes = useMemo(() => (trade && isClassic(trade) ? getRoutingDiagramEntries(trade) : []), [trade])

  const caption = trade ? (
    isClassic(trade) ? (
      <Flex gap="$spacing12">
        <RoutingDiagram
          routes={routes}
          currencyIn={trade.inputAmount.currency}
          currencyOut={trade.outputAmount.currency}
        />
        <Text variant="body4" color="$neutral2">
          {t('swap.bestRoute.cost', {
            gasPrice: gasFeeFormatted,
          })}
          {t('swap.route.optimizedGasCost')}
        </Text>
      </Flex>
    ) : isUniswapX(trade) ? (
      <Text variant="body4" color="$neutral2">
        <Trans
          i18nKey="uniswapX.aggregatesLiquidity"
          components={{
            logo: (
              <>
                <UniswapXText variant="body4">Uniswap X</UniswapXText>
              </>
            ),
          }}
        />
      </Text>
    ) : null
  ) : null

  const onPressLearnMore = async (): Promise<void> => {
    await openUri(uniswapUrls.helpArticleUrls.uniswapXInfo)
  }

  return (
    <WarningInfo
      infoButton={
        trade && isUniswapX(trade) ? (
          <TouchableArea onPress={onPressLearnMore}>
            <Text color="$accent1" variant={isWeb ? 'body4' : 'buttonLabel2'}>
              {t('common.button.learn')}
            </Text>
          </TouchableArea>
        ) : null
      }
      modalProps={{ modalName: ModalName.SwapReview }}
      tooltipProps={{ text: caption, placement: 'top', maxWidth: trade && isClassic(trade) ? 400 : undefined }}
    >
      {children}
    </WarningInfo>
  )
}
