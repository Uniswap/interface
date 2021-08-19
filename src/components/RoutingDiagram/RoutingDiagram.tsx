import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { Fragment } from 'react'
import { ChevronRight } from 'react-feather'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount | undefined][]
}

const StyledRow = styled(Row)<{ gap: string }>`
  display: flex;
  justify-content: space-between;
  position: relative;
`

const DottedLine = styled.div`
  border-width: 1px;
  border-color: ${({ theme }) => theme.bg4};
  border-style: dashed;
  position: absolute;
  height: 0px;
  width: calc(100% - 5px);
  z-index: 1;
`

const StyledChevronRight = styled(ChevronRight).attrs({ size: 20 })`
  color: ${({ theme }) => theme.bg4};
  margin: 0 !important; /* overrides AutoRow */
  stroke-width: 3px;
  background-color: ${({ theme }) => theme.bg0};
`

const TransparentBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg0};
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
    <AutoColumn gap="4px">
      {routes.map((route, index) => (
        <AutoColumn key={index}>
          <Route currencyIn={currencyIn} currencyOut={currencyOut} {...route} />
        </AutoColumn>
      ))}
    </AutoColumn>
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
      <DottedLine />
      <AutoRow gap="1px" width="100%" style={{ justifyContent: 'space-between', zIndex: 2 }}>
        <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridGap: '5px' }}>
          <TransparentBadge>
            <TYPE.small fontSize={13}>{currencyIn.symbol}</TYPE.small>
          </TransparentBadge>

          <TransparentBadge>
            <TYPE.small fontSize={12}>{percent.toSignificant(2)}%</TYPE.small>
          </TransparentBadge>
        </Box>

        {path.map(([currency0, currency1, feeAmount], index) => {
          return (
            <Fragment key={index}>
              {index !== 0 && <MouseOverChevron currency0={currency0} currency1={currency1} feeAmount={feeAmount} />}
              <AutoRow gap="1px" width="auto" key={index}>
                <CurrencyWrapper currency={currency0} />
              </AutoRow>
            </Fragment>
          )
        })}

        <StyledChevronRight />

        <CurrencyWrapper currency={currencyOut} />

        <TransparentBadge>
          <TYPE.small fontSize={13}>{currencyOut.symbol}</TYPE.small>
        </TransparentBadge>
      </AutoRow>
    </StyledRow>
  )
}

function MouseOverChevron({
  currency0,
  currency1,
  feeAmount,
}: {
  currency0: Currency
  currency1: Currency
  feeAmount: FeeAmount | undefined
}) {
  const feeAmountLabel = feeAmount ? `${feeAmount / 1000}%` : ''
  return (
    <MouseoverTooltipContent content={`${currency0.symbol}/${currency1.symbol} ${feeAmountLabel}`}>
      <StyledChevronRight />
    </MouseoverTooltipContent>
  )
}

function CurrencyWrapper({ currency }: { currency: Currency }) {
  const theme = useTheme()
  return (
    <Box style={{ backgroundColor: theme.bg0 }}>
      <CurrencyLogo currency={currency} size="15px" style={{ margin: '0 10px' }} />
    </Box>
  )
}
