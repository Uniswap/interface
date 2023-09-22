import { InterfaceTrade, QuoteMethod } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { ThemedText } from 'theme/components'

import UniswapXRouterLabel from './UniswapXRouterLabel'

export default function RouterLabel({ trade }: { trade: InterfaceTrade }) {
  if (isUniswapXTrade(trade)) {
    return (
      <UniswapXRouterLabel>
        <ThemedText.BodySmall>Uniswap X</ThemedText.BodySmall>
      </UniswapXRouterLabel>
    )
  }
  if (trade.quoteMethod === QuoteMethod.CLIENT_SIDE || trade.quoteMethod === QuoteMethod.CLIENT_SIDE_FALLBACK) {
    return <ThemedText.BodySmall>Uniswap Client</ThemedText.BodySmall>
  }
  return <ThemedText.BodySmall>Uniswap API</ThemedText.BodySmall>
}
