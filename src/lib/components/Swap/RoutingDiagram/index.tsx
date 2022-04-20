import { Plural, Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactComponent as DotLine } from 'assets/svg/dot_line.svg'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import TokenImg from 'lib/components/TokenImg'
import { AutoRouter } from 'lib/icons'
import styled, { Layer, ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, RoutingDiagramEntry } from './utils'

const StyledAutoRouterLabel = styled(ThemedText.ButtonSmall)`
  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

function Header({ routes }: { routes: RoutingDiagramEntry[] }) {
  return (
    <Row justify="space-between" gap={1}>
      <ThemedText.Subhead2>
        <Row gap={0.25}>
          <AutoRouter />
          <StyledAutoRouterLabel color="primary" lineHeight={'16px'}>
            <Trans>Auto Router</Trans>
          </StyledAutoRouterLabel>
        </Row>
      </ThemedText.Subhead2>
      <ThemedText.Body2>
        <Plural value={routes.length} _1="Best route via 1 hop" other="Best route via # hops" />
      </ThemedText.Body2>
    </Row>
  )
}

const Dots = styled(DotLine)`
  color: ${({ theme }) => theme.outline};
  position: absolute;
  z-index: ${Layer.UNDERLAYER};
`

const RouteRow = styled(Row)`
  flex-wrap: nowrap;
`

const RouteNode = styled(Row)`
  background-color: ${({ theme }) => theme.interactive};
  border-radius: ${({ theme }) => `${(theme.borderRadius ?? 1) * 0.5}em`};
  margin-left: 1.625em;
  padding: 0.25em 0.375em;
  width: max-content;
`

const RouteBadge = styled.div`
  background-color: ${({ theme }) => theme.module};
  border-radius: ${({ theme }) => `${(theme.borderRadius ?? 1) * 0.25}em`};
  padding: 0.125em;
`

function RouteDetail({ route }: { route: RoutingDiagramEntry }) {
  const protocol = route.protocol.toUpperCase()
  return (
    <RouteNode>
      <Row gap={0.375}>
        <ThemedText.Caption>{route.percent.toSignificant(2)}%</ThemedText.Caption>
        <RouteBadge>
          <ThemedText.Badge color="secondary">{protocol}</ThemedText.Badge>
        </RouteBadge>
      </Row>
    </RouteNode>
  )
}

const RoutePool = styled(RouteNode)`
  margin: 0 0.75em;
`

function Pool({
  originCurrency,
  targetCurrency,
  feeAmount,
}: {
  originCurrency: Currency
  targetCurrency: Currency
  feeAmount: FeeAmount
}) {
  return (
    <RoutePool>
      <ThemedText.Caption>
        <Row gap={0.25}>
          <TokenImg token={originCurrency} />
          <TokenImg token={targetCurrency} style={{ marginLeft: '-0.65em' }} />
          {feeAmount / 10_000}%
        </Row>
      </ThemedText.Caption>
    </RoutePool>
  )
}

function Route({ route }: { route: RoutingDiagramEntry }) {
  const [originCurrency] = route.path[0]
  const [, targetCurrency] = route.path[route.path.length - 1]

  return (
    <Row align="center" style={{ gridTemplateColumns: '1em 1fr 1em' }}>
      <TokenImg token={originCurrency} />
      <RouteRow flex style={{ position: 'relative' }}>
        <Dots />
        <RouteDetail route={route} />
        <RouteRow justify="space-evenly" flex>
          {route.path.map(([originCurrency, targetCurrency, feeAmount], index) => (
            <Pool key={index} originCurrency={originCurrency} targetCurrency={targetCurrency} feeAmount={feeAmount} />
          ))}
        </RouteRow>
      </RouteRow>
      <TokenImg token={targetCurrency} />
    </Row>
  )
}

export default function RoutingDiagram({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const routes: RoutingDiagramEntry[] = useMemo(() => getTokenPath(trade), [trade])

  return (
    <Column gap={0.75}>
      <Header routes={routes} />
      <Rule />
      {routes.map((route, index) => (
        <Route key={index} route={route} />
      ))}
    </Column>
  )
}
