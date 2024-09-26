import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { Gas } from 'components/Icons/Gas'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { UniswapXGradient, UniswapXRouterIcon } from 'components/RouterLabel/UniswapXRouterLabel'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import Row, { RowFixed } from 'components/deprecated/Row'
import { GasBreakdownTooltip } from 'components/swap/GasBreakdownTooltip'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import styled from 'lib/styled-components'
import { SubmittableTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { ThemedText } from 'theme/components'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const StyledGasIcon = styled(Gas)`
  height: 16px;
  width: 16px;
  // We apply the following to all children of the SVG in order to override the default color
  & > * {
    fill: ${({ theme }) => theme.neutral3};
  }
`

export default function GasEstimateTooltip({ trade, loading }: { trade?: SubmittableTrade; loading: boolean }) {
  const { chainId } = useSwapAndLimitContext()
  const { formatNumber } = useFormatter()

  if (!trade || !chainId || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(chainId)) {
    return null
  }

  return (
    <MouseoverTooltip
      size={TooltipSize.Small}
      text={<GasBreakdownTooltip trade={trade} />}
      onOpen={() => {
        sendAnalyticsEvent(SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED, {
          element: InterfaceElementName.AUTOROUTER_VISUALIZATION_ROW,
        })
      }}
      placement="right"
    >
      <LoadingOpacityContainer $loading={loading}>
        <RowFixed gap="xs">
          {isUniswapXTrade(trade) ? <UniswapXRouterIcon testId="gas-estimate-uniswapx-icon" /> : <StyledGasIcon />}
          <ThemedText.BodySmall color="neutral2">
            <Row gap="sm">
              {isUniswapXTrade(trade) ? (
                <UniswapXGradient>
                  <div style={{ fontWeight: 535 }}>
                    {formatNumber({
                      input: trade.totalGasUseEstimateUSD,
                      type: NumberType.FiatGasPrice,
                    })}
                  </div>
                </UniswapXGradient>
              ) : (
                <div>
                  {formatNumber({
                    input: trade.totalGasUseEstimateUSD,
                    type: NumberType.FiatGasPrice,
                  })}
                </div>
              )}

              {isUniswapXTrade(trade) && (trade.classicGasUseEstimateUSD ?? 0) > 0 && (
                <div>
                  <s>
                    {formatNumber({
                      input: trade.classicGasUseEstimateUSD,
                      type: NumberType.FiatGasPrice,
                    })}
                  </s>
                </div>
              )}
            </Row>
          </ThemedText.BodySmall>
        </RowFixed>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
