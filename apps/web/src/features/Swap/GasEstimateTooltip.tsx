import { Flex, Text } from 'ui/src'
import { Gas } from 'ui/src/components/icons/Gas'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, SwapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NumberType } from 'utilities/src/format/types'
import { LoadingOpacityContainer } from '~/components/Loader/styled'
import { UniswapXGradient, UniswapXRouterIcon } from '~/components/RouterLabel/UniswapXRouterLabel'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { GasBreakdownTooltip } from '~/features/Swap/GasBreakdownTooltip'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'
import { SubmittableTrade } from '~/state/routing/types'
import { isUniswapXTrade } from '~/state/routing/utils'

export default function GasEstimateTooltip({ trade, loading }: { trade?: SubmittableTrade; loading: boolean }) {
  const { chainId } = useMultichainContext()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  if (!trade || !chainId) {
    return null
  }

  return (
    <MouseoverTooltip
      size={TooltipSize.Small}
      text={<GasBreakdownTooltip trade={trade} />}
      onOpen={() => {
        sendAnalyticsEvent(SwapEventName.SwapAutorouterVisualizationExpanded, {
          element: ElementName.AutorouterVisualizationRow,
        })
      }}
      placement="right"
    >
      <LoadingOpacityContainer $loading={loading}>
        <Flex row gap="$gap4" alignItems="center" width="fit-content">
          {isUniswapXTrade(trade) ? (
            <UniswapXRouterIcon testId="gas-estimate-uniswapx-icon" />
          ) : (
            <Gas size="$icon.16" color="$neutral3" />
          )}
          <Flex row gap="$gap8" alignItems="center">
            {isUniswapXTrade(trade) ? (
              <UniswapXGradient>
                {convertFiatAmountFormatted(trade.totalGasUseEstimateUSD, NumberType.FiatGasPrice)}
              </UniswapXGradient>
            ) : (
              <Text variant="body3" color="$neutral3">
                {convertFiatAmountFormatted(trade.totalGasUseEstimateUSD, NumberType.FiatGasPrice)}
              </Text>
            )}

            {isUniswapXTrade(trade) && (trade.classicGasUseEstimateUSD ?? 0) > 0 && (
              <Text variant="body3" color="$neutral3" textDecorationLine="line-through">
                {convertFiatAmountFormatted(trade.classicGasUseEstimateUSD, NumberType.FiatGasPrice)}
              </Text>
            )}
          </Flex>
        </Flex>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
