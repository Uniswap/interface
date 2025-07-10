import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex } from 'ui/src'
import { ShieldCheck } from 'ui/src/components/icons/ShieldCheck'
import { UniswapLogo } from 'ui/src/components/icons/UniswapLogo'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import RoutingDiagram from 'uniswap/src/components/RoutingDiagram/RoutingDiagram'
import { TransactionDetailsTooltip as Tooltip } from 'uniswap/src/components/TransactionDetailsTooltip'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { isClassic } from 'uniswap/src/features/transactions/swap/utils/routing'
import getRoutingDiagramEntries from 'uniswap/src/utils/getRoutingDiagramEntries'

export function BestRouteTooltip(): JSX.Element | null {
  const { t } = useTranslation()
  const { trade } = useSwapTxContext()
  const routes = useMemo(() => (trade && isClassic(trade) ? getRoutingDiagramEntries(trade) : []), [trade])

  if (!trade || !isClassic(trade)) {
    return null
  }

  const { inputAmount, outputAmount } = trade

  return (
    <Tooltip.Outer>
      <Tooltip.Header
        title={{
          title: t('common.bestRoute.with', { provider: 'Uniswap API' }),
        }}
        Icon={UniswapLogo}
        iconColor="$accent1"
      />
      <Tooltip.Content>
        <Tooltip.Row>
          <Flex width="100%">
            <RoutingDiagram routes={routes} currencyIn={inputAmount.currency} currencyOut={outputAmount.currency} />
          </Flex>
        </Tooltip.Row>
      </Tooltip.Content>
      <Tooltip.Separator />
      <Tooltip.Description learnMoreUrl={uniswapUrls.helpArticleUrls.routingSettings} text={t('swap.autoRouter')} />
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
