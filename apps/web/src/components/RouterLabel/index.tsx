import UniswapXRouterLabel from 'components/RouterLabel/UniswapXRouterLabel'
import type { DefaultTheme } from 'lib/styled-components'
import { QuoteMethod, SubmittableTrade } from 'state/routing/types'
import { isUniswapXTrade } from 'state/routing/utils'
import { ThemedText } from 'theme/components'

export default function RouterLabel({ trade, color }: { trade: SubmittableTrade; color?: keyof DefaultTheme }) {
  if (isUniswapXTrade(trade)) {
    return (
      <UniswapXRouterLabel>
        <ThemedText.BodySmall>Uniswap X</ThemedText.BodySmall>
      </UniswapXRouterLabel>
    )
  }

  if (trade.quoteMethod === QuoteMethod.CLIENT_SIDE_FALLBACK) {
    return <ThemedText.BodySmall color={color}>Uniswap Client</ThemedText.BodySmall>
  }

  return <ThemedText.BodySmall color={color}>Uniswap API</ThemedText.BodySmall>
}
