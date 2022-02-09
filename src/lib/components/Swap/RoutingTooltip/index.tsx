import { Currency, TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactComponent as AutoRouterIcon } from 'assets/svg/auto_router.svg'
import { ReactComponent as DotLine } from 'assets/svg/dot_line.svg'
import Column from 'lib/components/Column'
import Row from 'lib/components/Row'
import Rule from 'lib/components/Rule'
import TokenImg from 'lib/components/TokenImg'
import Tooltip from 'lib/components/Tooltip'
import { Info } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, RoutingDiagramEntry } from './utils'

const Wrapper = styled(Column)`
  padding: 0.25em;
`

const StyledAutoRouterIcon = styled(AutoRouterIcon)`
  height: 1em;
  width: 1em;

  :hover {
    filter: brightness(1.3);
  }
`

const RouteRow = styled(Row)`
  grid-template-columns: 1em 1fr 1em;
  min-width: 18.75em;
`

const RouteDetailsContainer = styled(Row)`
  padding: 0.1rem 0.5rem;
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

const DotColor = styled(DotLine)`
  path {
    stroke: ${({ theme }) => theme.secondary};
  }
`

const BaseBadge = styled(Row)`
  background-color: ${({ theme }) => theme.outline};
  border-radius: 0.5em;
  grid-gap: 0.25em;
  padding: 0.25em;
  z-index: 3;
`

const VersionBadge = styled(BaseBadge)`
  background-color: ${({ theme }) => theme.module};
  border-radius: 0.25em;
  padding: 0 0.125em;
`

const DetailsRow = styled(Row)`
  display: grid;
  grid-template-columns: 4.25em 1fr;
  width: 100%;
`

const StyledAutoRouterLabel = styled(ThemedText.Body1)`
  color: #27ae60;
  font-weight: 500;
  line-height: 1rem;
  @supports (-webkit-background-clip: text) and (-webkit-text-fill-color: transparent) {
    background-image: linear-gradient(90deg, #2172e5 0%, #54e521 163.16%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

function Pool({ currency0, currency1, feeAmount }: { currency0: Currency; currency1: Currency; feeAmount: FeeAmount }) {
  return (
    <BaseBadge>
      <Row>
        <TokenImg token={currency0} />
        <TokenImg token={currency1} />
      </Row>
      <ThemedText.Subhead1 fontSize={14}>{feeAmount / 10000}%</ThemedText.Subhead1>
    </BaseBadge>
  )
}

export default function RoutingTooltip({ trade }: { trade: InterfaceTrade<Currency, Currency, TradeType> }) {
  const routes: RoutingDiagramEntry[] = useMemo(() => getTokenPath(trade), [trade])

  return (
    <Tooltip icon={Info} placement="right">
      <Wrapper gap={0.75}>
        <Row justify="space-between">
          <Row gap={0.25}>
            <StyledAutoRouterIcon />
            <StyledAutoRouterLabel>Auto Router</StyledAutoRouterLabel>
          </Row>
          <ThemedText.Body1 fontSize="14px">
            Best routes via {routes.length} hop{routes.length > 1 ? 's' : ''}.
          </ThemedText.Body1>
        </Row>
        <Rule />
        {routes.map((route, index) => (
          <RouteRow key={index} align="center">
            <TokenImg token={trade.inputAmount.currency} />
            <RouteDetailsContainer justify="flex-start" flex>
              <DottedLine>
                <DotColor />
              </DottedLine>
              <DetailsRow>
                <BaseBadge>
                  <VersionBadge>
                    <ThemedText.Caption color="secondary" fontWeight={600} fontSize={'10px'}>
                      {route.protocol.toUpperCase()}
                    </ThemedText.Caption>
                  </VersionBadge>
                  <ThemedText.ButtonSmall color="secondary">{route.percent.toSignificant(2)}%</ThemedText.ButtonSmall>
                </BaseBadge>
                <Row justify="space-around" flex style={{ width: '100%' }}>
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
    </Tooltip>
  )
}
