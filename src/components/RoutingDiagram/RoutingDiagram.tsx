import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { useCurrencyFromActiveList } from 'hooks/useCurrencyFromActiveList'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount][]
}

const Wrapper = styled(Box)`
  align-items: center;
  background-color: ${({ theme }) => theme.bg0};
  width: 400px;
`

const RouteContainerRow = styled(Row)`
  display: grid;
  grid-gap: 8px;
  grid-template-columns: 24px 1fr 24px;
`

const RouteRow = styled(Row)`
  align-items: center;
  display: flex;
  justify-content: center;
  padding: 0.1rem 0.5rem;
  position: relative;
`

const PoolBadge = styled(Badge)`
  display: flex;
  padding: 0.25rem 0.5rem;
`

const DottedLine = styled.div`
  border-color: ${({ theme }) => theme.bg4};
  border-top-style: dotted;
  border-width: 4px;
  height: 0px;
  position: absolute;
  width: calc(100%);
  z-index: 1;
`

const OpaqueBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg2};
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
    <Wrapper>
      {routes.map(({ percent, path }, index) => (
        <RouteContainerRow key={index}>
          <CurrencyLogo currency={currencyIn} />
          <Route percent={percent} path={path} />
          <CurrencyLogo currency={currencyOut} />
        </RouteContainerRow>
      ))}
    </Wrapper>
  )
}

function Route({ percent, path }: { percent: RoutingDiagramEntry['percent']; path: RoutingDiagramEntry['path'] }) {
  return (
    <RouteRow>
      <DottedLine />
      <OpaqueBadge>
        <TYPE.small fontSize={12} style={{ wordBreak: 'normal' }}>
          {percent.toSignificant(2)}%
        </TYPE.small>
      </OpaqueBadge>

      <AutoRow gap="1px" width="100%" style={{ justifyContent: 'space-evenly', zIndex: 2 }}>
        {path.map(([currency0, currency1, feeAmount], index) => (
          <Pool key={index} currency0={currency0} currency1={currency1} feeAmount={feeAmount} />
        ))}
      </AutoRow>
    </RouteRow>
  )
}

function Pool({ currency0, currency1, feeAmount }: { currency0: Currency; currency1: Currency; feeAmount: FeeAmount }) {
  const [currency0WithLogo, currency1WithLogo] = useCurrencyFromActiveList({ currency0, currency1 })

  return (
    <PoolBadge>
      <Box margin="0 5px 0 10px">
        <DoubleCurrencyLogo currency0={currency0WithLogo} currency1={currency1WithLogo} size={20} />
      </Box>
      <TYPE.small fontSize={12}>{feeAmount / 10000}%</TYPE.small>
    </PoolBadge>
  )
}
