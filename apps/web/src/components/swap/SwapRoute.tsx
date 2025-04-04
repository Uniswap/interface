import RouterLabel from 'components/RouterLabel'
import Column from 'components/deprecated/Column'
import { RowBetween } from 'components/deprecated/Row'
import { UniswapXDescription } from 'components/swap/GasBreakdownTooltip'
import { Trans } from 'react-i18next'
import { ClassicTrade, SubmittableTrade } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { Separator, ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { chainSupportsGasEstimates } from 'uniswap/src/features/chains/utils'
import { NumberType, useFormatter } from 'utils/formatNumbers'
import getRoutingDiagramEntries from 'utils/getRoutingDiagramEntries'

function useGasPrice({ gasUseEstimateUSD, inputAmount }: ClassicTrade) {
  const { formatNumber } = useFormatter()
  if (!gasUseEstimateUSD || !chainSupportsGasEstimates(inputAmount.currency.chainId)) {
    return undefined
  }

  return gasUseEstimateUSD === 0 ? '<$0.01' : formatNumber({ input: gasUseEstimateUSD, type: NumberType.FiatGasPrice })
}

function RouteLabel({ trade }: { trade: SubmittableTrade }) {
  return (
    <RowBetween>
      <ThemedText.BodySmall color="neutral2">
        <Trans i18nKey="swap.orderRouting" />
      </ThemedText.BodySmall>
      <RouterLabel trade={trade} color="neutral1" />
    </RowBetween>
  )
}

function PriceImpactRow({ trade }: { trade: ClassicTrade }) {
  const { formatPercent } = useFormatter()
  return (
    <ThemedText.BodySmall color="neutral2">
      <RowBetween>
        <Trans i18nKey="swap.priceImpact" />
        <Flex>{formatPercent(trade.priceImpact)}</Flex>
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

  return (
    <Column gap="md">
      <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
      <ThemedText.Caption color="neutral2">
        {Boolean(gasPrice) && <Trans i18nKey="swap.bestRoute.cost" values={{ gasPrice }} />}
        {Boolean(gasPrice) && ' '}
        <Trans i18nKey="swap.route.optimizedGasCost" />
      </ThemedText.Caption>
    </Column>
  )
}
