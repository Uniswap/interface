import { useTranslation } from 'react-i18next'
import { Text, TextProps } from 'ui/src'
import { UniswapXRouterLabel } from '~/features/Swap/components/RouterLabel/UniswapXRouterLabel'
import { QuoteMethod, SubmittableTrade } from '~/state/routing/types'
import { isUniswapXTrade } from '~/state/routing/utils'

export function RouterLabel({ trade, color }: { trade: SubmittableTrade; color?: TextProps['color'] }) {
  const { t } = useTranslation()

  if (isUniswapXTrade(trade)) {
    return (
      <UniswapXRouterLabel>
        {/* Note: we don't translate Uniswap X because it's a brand name */}
        <Text variant="body3">Uniswap X</Text>
      </UniswapXRouterLabel>
    )
  }

  if (trade.quoteMethod === QuoteMethod.CLIENT_SIDE_FALLBACK) {
    return (
      <Text variant="body3" color={color}>
        {t('swap.router.label.client')}
      </Text>
    )
  }

  return (
    <Text variant="body3" color={color}>
      {/* Note: we don't translate Uniswap API because it's a brand name */}
      Uniswap API
    </Text>
  )
}
