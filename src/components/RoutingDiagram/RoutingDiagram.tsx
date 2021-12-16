import { Trans } from '@lingui/macro'
import { Protocol } from '@uniswap/router-sdk'
import { Currency, Percent } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import Badge from 'components/Badge'
import CurrencyLogo from 'components/CurrencyLogo'
import DoubleCurrencyLogo from 'components/DoubleLogo'
import Row, { AutoRow } from 'components/Row'
import { useTokenInfoFromActiveList } from 'hooks/useTokenInfoFromActiveList'
import { Box } from 'rebass'
import styled from 'styled-components/macro'
import { ThemedText, Z_INDEX } from 'theme'

import { ReactComponent as DotLine } from '../../assets/svg/dot_line.svg'
import { MouseoverTooltip } from '../Tooltip'

export interface RoutingDiagramEntry {
  percent: Percent
  path: [Currency, Currency, FeeAmount][]
  protocol: Protocol
}

const Wrapper = styled(Box)`
  align-items: center;
  width: 100%;
`

const RouteContainerRow = styled(Row)`
  display: grid;
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
  padding: 4px 4px;
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
  border-radius: 8px;
  display: grid;
  font-size: 12px;
  grid-gap: 4px;
  grid-auto-flow: column;
  justify-content: start;
  padding: 4px 6px 4px 4px;
  z-index: ${Z_INDEX.sticky};
`

const ProtocolBadge = styled(Badge)`
  background-color: ${({ theme }) => theme.bg3};
  border-radius: 4px;
  color: ${({ theme }) => theme.text2};
  font-size: 10px;
  padding: 2px 4px;
  z-index: ${Z_INDEX.sticky + 1};
`

const BadgeText = styled(ThemedText.Small)`
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
          <CurrencyLogo currency={tokenIn} size={'20px'} />
          <Route entry={entry} />
          <CurrencyLogo currency={tokenOut} size={'20px'} />
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
          <BadgeText fontSize={12}>{protocol.toUpperCase()}</BadgeText>
        </ProtocolBadge>
        <BadgeText fontSize={14} style={{ minWidth: 'auto' }}>
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

  // TODO - link pool icon to info.uniswap.org via query params
  return (
    <MouseoverTooltip
      text={<Trans>{tokenInfo0?.symbol + '/' + tokenInfo1?.symbol + ' ' + feeAmount / 10000}% pool</Trans>}
    >
      <PoolBadge>
        <Box margin="0 4px 0 12px">
          <DoubleCurrencyLogo currency0={tokenInfo1} currency1={tokenInfo0} size={20} />
        </Box>
        <ThemedText.Small fontSize={14}>{feeAmount / 10000}%</ThemedText.Small>
      </PoolBadge>
    </MouseoverTooltip>
  )
}
