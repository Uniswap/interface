import { sendAnalyticsEvent } from '@uniswap/analytics'
import { InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import { UniswapXRouterIcon } from 'components/RouterLabel/UniswapXRouterLabel'
import { RowFixed } from 'components/Row'
import { MouseoverTooltip, TooltipSize } from 'components/Tooltip'
import { InterfaceTrade } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'

import { ReactComponent as GasIcon } from '../../assets/images/gas-icon.svg'
import SwapRoute from './SwapRoute'
import UniswapXGasTooltip from './UniswapXGasTooltip'

const StyledGasIcon = styled(GasIcon)`
  height: 18px;

  // We apply the following to all children of the SVG in order to override the default color
  & > * {
    stroke: ${({ theme }) => theme.textTertiary};
  }
`

export default function GasEstimateTooltip({ trade, loading }: { trade: InterfaceTrade; loading: boolean }) {
  const formattedGasPriceString = trade?.gasUseEstimateUSD
    ? trade.gasUseEstimateUSD === '0.00'
      ? '<$0.01'
      : '$' + trade.gasUseEstimateUSD
    : undefined

  if (isClassicTrade(trade)) {
    return (
      <MouseoverTooltip
        size={TooltipSize.Large}
        // TODO(WEB-3304)
        // Most of Swap-related components accept either `syncing`, `loading` or both props at the same time.
        // We are often using them interchangeably, or pass both values as one of them (`syncing={loading || syncing}`).
        // This is confusing and can lead to unpredicted UI behavior. We should refactor and unify this.
        text={<SwapRoute data-testid="swap-route-info" trade={trade} syncing={loading} />}
        onOpen={() => {
          sendAnalyticsEvent(SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED, {
            element: InterfaceElementName.AUTOROUTER_VISUALIZATION_ROW,
          })
        }}
        placement="bottom"
      >
        <LoadingOpacityContainer $loading={loading}>
          <RowFixed gap="xs">
            <StyledGasIcon />
            <ThemedText.BodySmall color="textSecondary">{formattedGasPriceString}</ThemedText.BodySmall>
          </RowFixed>
        </LoadingOpacityContainer>
      </MouseoverTooltip>
    )
  }

  return (
    <MouseoverTooltip
      size={TooltipSize.Small}
      text={<UniswapXGasTooltip data-testid="swap-route-info" trade={trade} />}
      onOpen={() => {
        sendAnalyticsEvent(SwapEventName.SWAP_AUTOROUTER_VISUALIZATION_EXPANDED, {
          element: InterfaceElementName.AUTOROUTER_VISUALIZATION_ROW,
        })
      }}
      placement="bottom"
    >
      <LoadingOpacityContainer $loading={loading}>
        <RowFixed gap="xs">
          <UniswapXRouterIcon />
          <ThemedText.BodySmall color="textSecondary">{formattedGasPriceString}</ThemedText.BodySmall>
        </RowFixed>
      </LoadingOpacityContainer>
    </MouseoverTooltip>
  )
}
