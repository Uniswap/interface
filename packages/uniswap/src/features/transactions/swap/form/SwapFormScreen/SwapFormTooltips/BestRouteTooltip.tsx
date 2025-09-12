import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { OrderRouting } from 'ui/src/components/icons/OrderRouting'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { RoutingDiagram } from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { useRoutingEntries, useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'

export function BestRouteTooltip(): JSX.Element | null {
  const { t } = useTranslation()
  const trade = useSwapTxStore((s) => s.trade)

  const routingProvider = useRoutingProvider({ routing: trade?.routing })

  const routes = useRoutingEntries({ trade })

  if (!trade || !routes || !routingProvider) {
    return null
  }

  const { inputAmount, outputAmount } = trade

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: routingProvider.name }),
        }}
        Icon={routingProvider.icon ?? OrderRouting}
        iconColor={routingProvider.iconColor || '$neutral1'}
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
          learnMoreUrl={uniswapUrls.helpArticleUrls.routingSettings}
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
        learnMoreUrl={uniswapUrls.helpArticleUrls.uniswapXInfo}
        text={t('routing.aggregateLiquidity.uniswapx')}
      />
    </Tooltip.Outer>
  )
}
