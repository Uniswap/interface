import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { AutoColumn } from 'components/Column'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow, RowBetween } from 'components/Row'
import { ChevronRight } from 'react-feather'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

export interface Route {
  percent: number
  path: [Currency, Currency, FeeAmount][]
}

const Wrapper = styled(AutoColumn)`
  border-top: 1px solid ${({ theme }) => theme.bg2};
  border-bottom: 1px solid ${({ theme }) => theme.bg2};

  width: 100%;
  padding: 1rem 0;
`

const StyledRow = styled(Row)<{ gap: string }>`
  display: grid;
  grid-gap: ${({ gap }) => gap};

  & > * {
    grid-row: 1;
  }
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
  routes: Route[]
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
  percent: number
  path: [Currency, Currency, FeeAmount][]
}) {
  return (
    <StyledRow gap="8px">
      <Badge>
        <TYPE.small fontSize={12}>{percent}%</TYPE.small>
      </Badge>
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
    </StyledRow>
  )
}

function Pool({ currency0, currency1, feeAmount }: { currency0: Currency; currency1: Currency; feeAmount: FeeAmount }) {
  return (
    <Badge>
      <StyledRow gap="4px">
        <Box style={{ marginLeft: '6px' }}>
          <DoubleCurrencyLogo currency0={currency0} currency1={currency1} size={13} />
        </Box>
        <TYPE.small fontSize={12}>{feeAmount / 10000}%</TYPE.small>
      </StyledRow>
    </Badge>
  )
}
