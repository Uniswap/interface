import { Box } from 'rebass'
import { Currency } from '@uniswap/sdk-core'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import { AutoRow } from 'components/Row'
import { AutoColumn } from 'components/Column'
import { TYPE } from 'theme'
import { ChevronRight } from 'react-feather'
import styled from 'styled-components/macro'
import Badge from 'components/Badge'
import { FeeAmount } from '@uniswap/v3-sdk'

export interface Route {
  percent: number
  path: [Currency, Currency, FeeAmount][]
}

const StyledChevronRight = styled(ChevronRight).attrs({ size: 16 })``

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
    <Box>
      {routes.map((route, index) => (
        <AutoColumn gap="4px" key={index}>
          <Route currencyIn={currencyIn} currencyOut={currencyOut} {...route} />
        </AutoColumn>
      ))}
    </Box>
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
    <AutoRow gap="4px" width="auto">
      <Badge>{percent}</Badge>
      <TYPE.black>{currencyIn.symbol}</TYPE.black>
      <StyledChevronRight />
      {path.map(([currency0, currency1, feeAmount], index) => {
        return (
          <AutoRow gap="4px" width="auto" key={index}>
            <Pool currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
            <StyledChevronRight />
          </AutoRow>
        )
      })}
      <TYPE.black>{currencyOut.symbol}</TYPE.black>
    </AutoRow>
  )
}

function Pool({ currency0, currency1, feeAmount }: { currency0: Currency; currency1: Currency; feeAmount: FeeAmount }) {
  return (
    <Badge>
      <AutoRow gap="4px" width="auto">
        <DoubleCurrencyLogo currency0={currency0} currency1={currency1} />
        {feeAmount}
      </AutoRow>
    </Badge>
  )
}
