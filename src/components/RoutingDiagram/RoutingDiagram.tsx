import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { Version } from 'hooks/useToggledVersion'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { TYPE } from 'theme'
import { Z_INDEX } from 'theme'

import { ReactComponent as DotLine } from '../../assets/svg/dot_line.svg'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount][]
  protocol: Version
}

const Wrapper = styled(Box)`
  align-items: center;
  background-color: ${({ theme }) => theme.bg0};
  width: 430px;
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
  display: flex;
  align-items: center;
  position: absolute;
  width: calc(100%);
  z-index: 1;
  opacity: 0.5;
`

const DotColor = styled(DotLine)`
  path {
    stroke: ${({ theme }) => theme.bg4};
  }
`

const OpaqueBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg2};
  display: grid;
  grid-gap: 4px;
  grid-auto-flow: column;
  justify-content: start;
  z-index: ${Z_INDEX.sticky};
`

const ProtocolBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg3};
  border-radius: 0.3rem;
  z-index: ${Z_INDEX.sticky + 1};
`

const BadgeText = styled(TYPE.small)`
  word-break: normal;
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
  const tokenIn = useTokenInfoFromActiveList(currencyIn)
  const tokenOut = useTokenInfoFromActiveList(currencyOut)

  return (
    <Wrapper>
      {routes.map((entry, index) => (
        <RouteContainerRow key={index}>
          <CurrencyLogo currency={tokenIn} />
          <Route entry={entry} />
          <CurrencyLogo currency={tokenOut} />
        </RouteContainerRow>
      ))}
    </Wrapper>
  )
}

function Route({ entry: { percent, path, protocol } }: { entry: RoutingDiagramEntry }) {
  return (
    <RouteRow>
      <DottedLine>
        <DotColor />
      </DottedLine>
      <OpaqueBadge>
        <ProtocolBadge>
          <BadgeText fontSize={11}>{protocol.toUpperCase()}</BadgeText>
        </ProtocolBadge>
        <BadgeText fontSize={12} style={{ minWidth: 'auto' }}>
          {percent.toSignificant(2)}%
        </BadgeText>
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
  const tokenInfo0 = useTokenInfoFromActiveList(currency0)
  const tokenInfo1 = useTokenInfoFromActiveList(currency1)

  return (
    <PoolBadge>
      <Box margin="0 5px 0 10px">
        <DoubleCurrencyLogo currency0={tokenInfo1} currency1={tokenInfo0} size={20} />
      </Box>
      <TYPE.small fontSize={12}>{feeAmount / 10000}%</TYPE.small>
    </PoolBadge>
  )
}
