import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { MouseoverTooltipContent } from 'components/Tooltip'
import { ReactNode } from 'react'
import { ChevronRight } from 'react-feather'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount | undefined][]
}

const MainRow = styled(Box)`
  display: grid;
  grid-template-columns: 60px 1fr 60px;
  grid-gap: 8px;
  justify-content: space-between;
  width: 100%;
`

const EdgeRow = styled(Box)`
  align-items: center;
  display: grid;
  grid-gap: 8px;
  grid-template-columns: 1fr 1fr;
  justify-content: space-between;
`

const RouteRow = styled(Row)`
  border-radius: 12px;
  border: 1px solid ${({ theme }) => theme.bg2};
  display: flex;
  justify-content: center;
  padding: 0.1rem 0.5rem;
  position: relative;

  &:hover {
    border: 1px solid ${({ theme }) => theme.bg4};
  }
`

const PoolBadge = styled(Badge)`
  padding: 0.25rem 0.5rem;
  display: flex;
`

const DottedLine = styled.div`
  border-width: 1px;
  border-color: ${({ theme }) => theme.bg4};
  border-style: dashed;
  position: absolute;
  height: 0px;
  width: calc(100% - 1.5rem);
  z-index: 1;
`

const StyledChevronRight = styled(ChevronRight).attrs({ size: 20 })`
  color: ${({ theme }) => theme.bg4};
  margin: 0 !important; /* overrides AutoRow */
  stroke-width: 3px;
  background-color: ${({ theme }) => theme.bg0};
`

const OpaqueBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg0};
  z-index: 2;
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
    <MainRow>
      <EdgeRow>
        <CurrencyLogo currency={currencyIn} />
        <StyledChevronRight />
      </EdgeRow>

      <Box>
        {routes.map((route, index) => (
          <AutoColumn key={index}>
            <Route currencyIn={currencyIn} currencyOut={currencyOut} {...route} />
          </AutoColumn>
        ))}
      </Box>

      <EdgeRow>
        <StyledChevronRight />
        <CurrencyLogo currency={currencyOut} />
      </EdgeRow>
    </MainRow>
  )
}

function Route({
  percent,
  path,
}: {
  currencyIn: Currency
  currencyOut: Currency
  percent: RoutingDiagramEntry['percent']
  path: RoutingDiagramEntry['path']
}) {
  return (
    <RouteRow>
      <DottedLine />
      <OpaqueBadge>
        <TYPE.small fontSize={12}>{percent.toSignificant(2)}%</TYPE.small>
      </OpaqueBadge>

      <AutoRow gap="1px" width="100%" style={{ justifyContent: 'space-evenly', zIndex: 2 }}>
        {path.map(([currency0, currency1, feeAmount], index) => (
          <Pool key={index} currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
        ))}
      </AutoRow>
    </RouteRow>
  )
}

function MouseOverChevron({
  currency0,
  currency1,
  feeAmount,
  children,
}: {
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount | undefined
  children: ReactNode
}) {
  const feeAmountLabel = feeAmount ? `${feeAmount / 10000}%` : ''
  return (
    <MouseoverTooltipContent
      width="auto"
      content={<TYPE.small fontSize={12}>{`${currency0.symbol}/${currency1.symbol} ${feeAmountLabel}`}</TYPE.small>}
      placement="top"
    >
      {children}
    </MouseoverTooltipContent>
  )
}

function Pool({
  currency0,
  currency1,
  feeAmount,
}: {
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount | undefined
}) {
  return (
    <MouseOverChevron currency0={currency0} currency1={currency1} feeAmount={feeAmount}>
      <PoolBadge>
        <Box margin="0 5px 0 10px">
          <DoubleCurrencyLogo currency0={currency1} currency1={currency0} size={20} />
        </Box>
        {feeAmount && <TYPE.small fontSize={12}>{feeAmount / 10000}%</TYPE.small>}
      </PoolBadge>
    </MouseOverChevron>
  )
}
