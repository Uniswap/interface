import { Plural, Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactComponent as DotLineImage } from 'assets/svg/dot_line.svg'
import Badge from 'lib/components/Badge'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import TokenImg from 'lib/components/TokenImg'
import { AutoRouter } from 'lib/icons'
import styled, { Layer, ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, RoutingDiagramEntry } from './utils'

const Wrapper = styled(Column)`
  padding: 0.25em;
`

const RouteRow = styled(Row)`
  grid-template-columns: 1em 1.15em 1fr 1em;
  min-width: 430px;
`

const RouteDetailsContainer = styled(Row)`
  padding: 0.1em 0.5em;
  position: relative;
`

const DotsContainer = styled.div`
  align-items: center;
  display: flex;
  opacity: 0.5;
  position: absolute;
  width: calc(100% - 1em);
  z-index: ${Layer.UNDERLAYER};
`

const DotsContainerShort = styled(DotsContainer)`
  overflow: hidden;
  position: relative;
  width: 71px;
`

const Dots = styled(DotLineImage)`
  path {
    stroke: ${({ theme }) => theme.secondary};
  }
`

const DetailsRow = styled(Row)`
  display: grid;
  grid-template-columns: 4.8125em 1fr;
  width: 100%;
`

const StyledAutoRouterLabel = styled(ThemedText.ButtonSmall)`
  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
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
    <Badge padding="0 4px" color="dialog">
      <Badge gap={0.375}>
        <Row>
          <TokenImg token={originCurrency} />
          <TokenImg token={targetCurrency} />
        </Row>
        <ThemedText.Subhead2>{feeAmount / 10_000}%</ThemedText.Subhead2>
      </Badge>
    </Badge>
  )
}

export default function RoutingDiagram({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const routes: RoutingDiagramEntry[] = useMemo(() => getTokenPath(trade), [trade])

  return (
    <Wrapper gap={0.75}>
      <Row justify="space-between">
        <Row gap={0.25}>
          <AutoRouter />
          <StyledAutoRouterLabel color="primary" lineHeight={'16px'}>
            <Trans>Auto Router</Trans>
          </StyledAutoRouterLabel>
        </Row>
        <ThemedText.ButtonSmall>
          <Plural value={routes.length} _1="Best route via 1 hop" other="Best route via # hops" />
        </ThemedText.ButtonSmall>
      </Row>
      <Rule />
      {routes.map((route, index) => (
        <RouteRow key={index} align="center">
          <TokenImg token={trade.inputAmount.currency} />
          <DotsContainerShort>
            <Dots />
          </DotsContainerShort>
          <RouteDetailsContainer justify="flex-start" flex>
            <DotsContainer>
              <Dots />
            </DotsContainer>
            <DetailsRow>
              <Badge padding="0 4px" color="dialog">
                <Badge gap={0.375}>
                  <ThemedText.ButtonSmall color="secondary">{route.percent.toSignificant(2)}%</ThemedText.ButtonSmall>
                  <Badge padding="0.125em" borderRadius={0.25} color="module">
                    <ThemedText.Badge color="secondary" fontSize={'0.5rem'}>
                      {route.protocol.toUpperCase()}
                    </ThemedText.Badge>
                  </Badge>
                </Badge>
              </Badge>
              <Row justify="space-evenly" flex style={{ width: '100%' }}>
                {route.path.map(([originCurrency, targetCurrency, feeAmount], index) => (
                  <Pool
                    key={index}
                    originCurrency={originCurrency}
                    targetCurrency={targetCurrency}
                    feeAmount={feeAmount}
                  />
                ))}
              </Row>
            </DetailsRow>
          </RouteDetailsContainer>
          <TokenImg token={trade.outputAmount.currency} />
        </RouteRow>
      ))}
    </Wrapper>
  )
}
