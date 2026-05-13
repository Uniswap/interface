import { Text, TextProps } from 'ui/src'
import { UniswapXRouterLabel } from '~/features/Swap/components/RouterLabel/UniswapXRouterLabel'
import { QuoteMethod, SubmittableTrade } from '~/state/routing/types'
import { isUniswapXTrade } from '~/state/routing/utils'

export function RouterLabel({ trade, color }: { trade: SubmittableTrade; color?: TextProps['color'] }) {
  if (isUniswapXTrade(trade)) {
    return (
      <UniswapXRouterLabel>
        <Text variant="body3">Uniswap X</Text>
      </UniswapXRouterLabel>
    )
  }

  if (trade.quoteMethod === QuoteMethod.CLIENT_SIDE_FALLBACK) {
    return (
      <Text variant="body3" color={color}>
        Uniswap Client
      </Text>
    )
  }

  return (
    <Text variant="body3" color={color}>
      Uniswap API
    </Text>
  )
}
