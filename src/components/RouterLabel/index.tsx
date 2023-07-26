import { InterfaceTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { ThemedText } from 'theme'

import UniswapXRouterLabel from './UniswapXRouterLabel'

export default function RouterLabel({ trade }: { trade: InterfaceTrade }) {
  if (isUniswapXTrade(trade)) {
    return (
      <UniswapXRouterLabel>
        <ThemedText.BodySmall>Uniswap X</ThemedText.BodySmall>
      </UniswapXRouterLabel>
    )
  }
  if (trade.fromClientRouter) {
    return <ThemedText.BodySmall>Uniswap Client</ThemedText.BodySmall>
  }
  return <ThemedText.BodySmall>Uniswap API</ThemedText.BodySmall>
}
