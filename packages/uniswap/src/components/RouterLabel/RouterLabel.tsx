import { useTranslation } from 'react-i18next'
import { Flex, UniswapXText } from 'ui/src'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { isAggregator, isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

type QuoteWithRoute = {
  route?: unknown
}

type RouteEntry = {
  type?: unknown
  protocol?: unknown
}

function getAggregatorRouteLabel(quote: unknown): string | undefined {
  if (!isRecord(quote)) {
    return undefined
  }

  const route = (quote as QuoteWithRoute).route
  if (!Array.isArray(route) || route.length === 0) {
    return undefined
  }

  const first = route[0]
  if (!isRecord(first)) {
    return undefined
  }

  const { type, protocol } = first as RouteEntry
  if (typeof type === 'string' && type.length > 0) {
    return type
  }
  if (typeof protocol === 'string' && protocol.length > 0) {
    return protocol
  }
  return undefined
}

export function RouterLabel(): JSX.Element | null {
  const { trade } = useSwapTxContext()
  const { t } = useTranslation()

  if (!trade) {
    return null
  }

  if (isUniswapX(trade)) {
    return (
      <Flex row alignItems="center">
        <UniswapX size="$icon.16" mr="$spacing2" />
        <UniswapXText variant="body3">{t('uniswapx.label')}</UniswapXText>
      </Flex>
    )
  }

  if (isClassic(trade)) {
    return <>Ring API</>
  }

  if (isAggregator(trade)) {
    const routeLabel = getAggregatorRouteLabel(trade.quote?.quote as unknown)
    return <>{routeLabel ?? 'AGGREGATOR'}</>
  }

  return null
}
