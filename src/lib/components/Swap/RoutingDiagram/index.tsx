import { Plural, Trans } from '@lingui/macro'
import { Currency, TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactComponent as AutoRouterIcon } from 'assets/svg/auto_router.svg'
import { ReactComponent as DotLine } from 'assets/svg/dot_line.svg'
import { Badge, BadgeDark } from 'lib/components/Badge'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import TokenImg from 'lib/components/TokenImg'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, routerGradientCss, RoutingDiagramEntry } from './utils'

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

const DottedLine = styled.div`
  align-items: center;
  display: flex;
  opacity: 0.5;
  position: absolute;
  width: calc(100% - 1em);
  z-index: 1;
`

const ShortDottedLine = styled(DottedLine)`
  overflow: hidden;
  position: relative;
  width: 71px;
`

const DotColor = styled(DotLine)`
  path {
    stroke: ${({ theme }) => theme.secondary};
  }
`

// Used to cutoff space between badges and dotted lines.
const TransparentBadgeWrapper = styled(Badge)`
  background-color: ${({ theme }) => theme.dialog};
  padding: 0 4px;
`

const DetailsRow = styled(Row)`
  display: grid;
  grid-template-columns: 4.8125em 1fr;
  width: 100%;
`

const StyledAutoRouterLabel = styled(ThemedText.ButtonSmall)`
  color: #27ae60;
  font-weight: 500;
  line-height: 1rem;

  ${routerGradientCss}
`

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 0.875em;
  width: 0.875em;
  :hover {
    filter: brightness(1.3);
  }
`

function Pool({ currency0, currency1, feeAmount }: { currency0: Currency; currency1: Currency; feeAmount: FeeAmount }) {
  return (
    <TransparentBadgeWrapper>
      <Badge gap={0.375}>
        <Row>
          <TokenImg token={currency0} />
          <TokenImg token={currency1} />
        </Row>
        <ThemedText.Subhead2>{feeAmount / 10000}%</ThemedText.Subhead2>
      </Badge>
    </TransparentBadgeWrapper>
  )
}

export default function RoutingDiagram({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const routes: RoutingDiagramEntry[] = useMemo(() => getTokenPath(trade), [trade])

  return (
    <Wrapper gap={0.75}>
      <Row justify="space-between">
        <Row gap={0.25}>
          <StyledAutoRouterIcon />
          <StyledAutoRouterLabel>
            <Trans>Auto Router</Trans>
          </StyledAutoRouterLabel>
        </Row>
        <ThemedText.ButtonSmall>
          <Trans>
            Best route via {routes.length} <Plural value={routes.length} one="hop" other="hops" />
          </Trans>
        </ThemedText.ButtonSmall>
      </Row>
      <Rule />
      {routes.map((route, index) => (
        <RouteRow key={index} align="center">
          <TokenImg token={trade.inputAmount.currency} />
          <ShortDottedLine>
            <DotColor />
          </ShortDottedLine>
          <RouteDetailsContainer justify="flex-start" flex>
            <DottedLine>
              <DotColor />
            </DottedLine>
            <DetailsRow>
              <TransparentBadgeWrapper>
                <Badge gap={0.375}>
                  <ThemedText.ButtonSmall color="secondary">{route.percent.toSignificant(2)}%</ThemedText.ButtonSmall>
                  <BadgeDark padding="0.125em" borderRadius={0.25}>
                    <ThemedText.Badge color="secondary">{route.protocol.toUpperCase()}</ThemedText.Badge>
                  </BadgeDark>
                </Badge>
              </TransparentBadgeWrapper>
              <Row justify="space-evenly" flex style={{ width: '100%' }}>
                {route.path.map(([currency0, currency1, feeAmount], index) => (
                  <Pool key={index} currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
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
