import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { RoutingDiagram } from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { useRoutingEntries, useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'

// Trade comes in as a prop rather than from useSwapTxStore: that store suppresses the trade
// when no wallet is connected, which left the tooltip empty for logged-out users.
export function BestRouteTooltip({ trade }: { trade: Trade }): JSX.Element | null {
  const { t } = useTranslation()

  const routingProvider = useRoutingProvider({ routing: trade.routing })

  const routes = useRoutingEntries({ trade })

  if (!routes || routes.length === 0 || !routingProvider) {
    return null
  }

  const { inputAmount, outputAmount } = trade

  const icon = routingProvider.icon ?? OrderRouting
  const iconColor = routingProvider.iconColor || '$neutral1'

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: routingProvider.name }),
        }}
        Icon={icon}
        iconColor={iconColor}
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Flex width="100%">
            <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
          </Flex>
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Separator />
      {routingProvider.getDescription && (
        <Tooltip.Description
          learnMoreUrl={UniswapHelpUrls.articles.routingSettings}
          text={routingProvider.getDescription(t)}
        />
      )}
    </Tooltip.Outer>
  )
}

export function BestRouteUniswapXTooltip(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'UniswapX' }),
          uniswapX: true,
        }}
        Icon={UniswapX}
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Tooltip.LineItemLabel label={t('swap.settings.protection.title')} />
          <Tooltip.LineItemValue Icon={ShieldCheck} value={t('common.active')} iconColor="$uniswapXPurple" />
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Description
        learnMoreUrl={UniswapHelpUrls.articles.uniswapXInfo}
        text={t('routing.aggregateLiquidity.uniswapx')}
      />
    </Tooltip.Outer>
  )
}
