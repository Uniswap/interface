import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import RoutingDiagram from 'components/RoutingDiagram/RoutingDiagram'
import { RowBetween } from 'components/Row'
import { SUPPORTED_GAS_ESTIMATE_CHAIN_IDS } from 'constants/chains'
import useAutoRouterSupported from 'hooks/useAutoRouterSupported'
import { ClassicTrade, SubmittableTrade } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { Separator, ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'

import RouterLabel from '../RouterLabel'
import { UniswapXDescription } from './GasBreakdownTooltip'

// TODO(WEB-2022)
// Can `trade.gasUseEstimateUSD` be defined when `chainId` is not in `SUPPORTED_GAS_ESTIMATE_CHAIN_IDS`?
function useGasPrice({ gasUseEstimateUSD, inputAmount }: ClassicTrade) {
  const { formatNumber } = useFormatter()
  if (!gasUseEstimateUSD || !SUPPORTED_GAS_ESTIMATE_CHAIN_IDS.includes(inputAmount.currency.chainId)) return undefined

  return gasUseEstimateUSD === 0 ? '<$0.01' : formatNumber({ input: gasUseEstimateUSD, type: NumberType.FiatGasPrice })
}

function RouteLabel({ trade }: { trade: SubmittableTrade }) {
  return (
    <RowBetween>
      <ThemedText.BodySmall color="neutral2">Order Routing</ThemedText.BodySmall>
      <RouterLabel trade={trade} color="neutral1" />
    </RowBetween>
  )
}

function PriceImpactRow({ trade }: { trade: ClassicTrade }) {
  const { formatPercent } = useFormatter()
  return (
    <ThemedText.BodySmall color="neutral2">
      <RowBetween>
        <Trans>Price Impact</Trans>
        <div>{formatPercent(trade.priceImpact)}</div>
      </RowBetween>
    </ThemedText.BodySmall>
  )
}

export function RoutingTooltip({ trade }: { trade: SubmittableTrade }) {
  return isClassicTrade(trade) ? (
    <Column gap="md">
      <PriceImpactRow trade={trade} />
      <Separator />
      <RouteLabel trade={trade} />
      <SwapRoute trade={trade} />
    </Column>
  ) : (
    <Column gap="md">
      <RouteLabel trade={trade} />
      <Separator />
      <UniswapXDescription />
    </Column>
  )
}

export function SwapRoute({ trade }: { trade: ClassicTrade }) {
  const { inputAmount, outputAmount } = trade
  const routes = getRoutingDiagramEntries(trade)
  const gasPrice = useGasPrice(trade)

  return useAutoRouterSupported() ? (
    <Column gap="md">
      <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
      <ThemedText.Caption color="neutral2">
        {Boolean(gasPrice) && <Trans>Best price route costs ~{gasPrice} in gas. </Trans>}
        {Boolean(gasPrice) && ' '}
        <Trans>
          This route optimizes your total output by considering split routes, multiple hops, and the gas cost of each
          step.
        </Trans>
      </ThemedText.Caption>
    </Column>
  ) : (
    <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
  )
}
