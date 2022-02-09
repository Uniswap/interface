import { Currency, TradeType } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ReactComponent as DotLine } from 'assets/svg/dot_line.svg'
import Row from 'lib/components/Row'
import TokenImg from 'lib/components/TokenImg'
import Tooltip from 'lib/components/Tooltip'
import { Info } from 'lib/icons'
import styled, { ThemedText } from 'lib/theme'
import { useMemo } from 'react'
import { InterfaceTrade } from 'state/routing/types'

import { getTokenPath, RoutingDiagramEntry } from './utils'

const RouteRow = styled(Row)`
  grid-template-columns: 1em 1fr 1em;
  min-width: 300px;
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
  border-radius: 8px;
  grid-gap: 4px;
  padding: 4px;
  z-index: 3;
`

const VersionBadge = styled(BaseBadge)`
  background-color: ${({ theme }) => theme.module};
  border-radius: 4px;
  padding: 0px 2px;
`

const DetailsRow = styled(Row)`
  display: grid;
  grid-template-columns: 68px 1fr;
  width: 100%;
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
    </Tooltip>
  )
}
