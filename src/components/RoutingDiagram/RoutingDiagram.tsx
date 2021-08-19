import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { ChevronRight } from 'react-feather'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount | undefined][]
}

const Wrapper = styled(AutoColumn)`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  border-bottom: 1px solid ${({ theme }) => theme.bg2};

  width: 100%;
  padding: 0.5rem 0;
`

const StyledRow = styled(Row)<{ gap: string }>`
  display: flex;
  justify-content: space-between;
`

const StyledChevronRight = styled(ChevronRight).attrs({ size: 20 })`
  color: ${({ theme }) => theme.bg3};
  margin: 0 !important; /* overrides AutoRow */
  stroke-width: 3px;
`

export default function RoutingDiagram({
  currencyIn,
  currencyOut,
  routes,
}: {
  currencyIn: Currency
  currencyOut: Currency
  routes: RoutingDiagramEntry[]
}) {
  return (
    <Wrapper gap="4px">
      {routes.map((route, index) => (
        <AutoColumn key={index}>
          <Route currencyIn={currencyIn} currencyOut={currencyOut} {...route} />
        </AutoColumn>
      ))}
    </Wrapper>
  )
}

function Route({
  currencyIn,
  currencyOut,
  percent,
  path,
}: {
  currencyIn: Currency
  currencyOut: Currency
  percent: RoutingDiagramEntry['percent']
  path: RoutingDiagramEntry['path']
}) {
  return (
    <StyledRow gap="8px">
      <AutoRow gap="1px" width="auto">
        <TYPE.small fontSize={13}>{currencyIn.symbol}</TYPE.small>
        <StyledChevronRight />
        {path.map(([currency0, currency1, feeAmount], index) => {
          return (
            <AutoRow gap="1px" width="auto" key={index}>
              <Pool currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
              <StyledChevronRight />
            </AutoRow>
          )
        })}
        <TYPE.small fontSize={13}>{currencyOut.symbol}</TYPE.small>
      </AutoRow>
      <Badge>
        <TYPE.small fontSize={12}>{percent.toSignificant(2)}%</TYPE.small>
      </Badge>
    </StyledRow>
  )
}

function Pool({
  currency0: coveredCurrency,
  currency1: higherCurrency,
  feeAmount,
}: {
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount | undefined
}) {
  return (
    <Badge>
      <StyledRow gap="4px">
        <Box style={{ marginLeft: '6px', height: '15px' }}>
          <DoubleCurrencyLogo currency0={higherCurrency} currency1={coveredCurrency} size={13} />
        </Box>
        {feeAmount && <TYPE.small fontSize={12}>{feeAmount / 10000}%</TYPE.small>}
      </StyledRow>
    </Badge>
  )
}
