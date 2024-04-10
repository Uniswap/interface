import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import Column from 'components/Column'
import { ClosedCircle, DoubleArrow } from 'components/Pools/PoolDetails/icons'
import { DoubleTokenLogo } from 'components/Pools/PoolDetails/PoolDetailsHeader'
import Row from 'components/Row'
import { BIPS_BASE } from 'constants/misc'
import { chainIdToBackendName } from 'graphql/data/util'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import styled, { useTheme } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { useFormatter } from 'utils/formatNumbers'

const PositionTableWrapper = styled(Column)`
  gap: 24px;
  margin-top: 24px;
  width: 100%;
`

const PositionWrapper = styled(Column)`
  gap: 4px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  width: 100%;
  ${ClickableStyle}
  padding: 16px;
`

const FeeTier = styled(ThemedText.LabelMicro)`
  padding: 4px 6px;
  background: ${({ theme }) => theme.surface2};
`

const StatusWrapper = styled(Row)<{ status: PositionStatus }>`
  gap: 8px;
  width: max-content;
  margin-right: 0;
  margin-left: auto;
  color: ${({ theme, status }) =>
    status === PositionStatus.IN_RANGE
      ? theme.success
      : status === PositionStatus.OUT_OF_RANGE
      ? theme.deprecated_accentWarning
      : theme.neutral2};
`

const RangeWrapper = styled(Row)`
  gap: 10px;

  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }
`

const StyledDoubleArrow = styled(DoubleArrow)`
  @media screen and (max-width: ${BREAKPOINTS.sm}px) {
    display: none;
  }
`

const RangeText = styled(ThemedText.Caption)`
  width: max-content;
  white-space: nowrap;
`

const StyledDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.success};
`

enum PositionStatus {
  IN_RANGE = 'In range',
  OUT_OF_RANGE = 'Out of range',
  CLOSED = 'Closed',
}

function PositionRow({ positionInfo }: { positionInfo: PositionInfo }) {
  const tokens = [
    {
      id: positionInfo.details.token0,
      address: positionInfo.details.token0,
      chain: chainIdToBackendName(positionInfo.chainId),
    },
    {
      id: positionInfo.details.token0,
      address: positionInfo.details.token1,
      chain: chainIdToBackendName(positionInfo.chainId),
    },
  ]
  const { chainId: walletChainId, connector } = useWeb3React()
  const navigate = useNavigate()
  const switchChain = useSwitchChain()
  const theme = useTheme()
  const { formatTickPrice } = useFormatter()

  const onClick = useCallback(async () => {
    if (walletChainId !== positionInfo.chainId) await switchChain(connector, positionInfo.chainId)
    navigate('/pool/' + positionInfo.details.tokenId)
  }, [connector, navigate, positionInfo.chainId, positionInfo.details.tokenId, switchChain, walletChainId])

  const status = positionInfo.inRange
    ? PositionStatus.IN_RANGE
    : positionInfo.closed
    ? PositionStatus.CLOSED
    : PositionStatus.OUT_OF_RANGE

  const priceUpper = positionInfo.position.token0PriceLower.invert()
  const priceLower = positionInfo.position.token0PriceUpper.invert()

  const ticksAtLimit = {
    LOWER: parseFloat(priceLower.toFixed(0)) === 0,
    UPPER: parseFloat(priceUpper.toFixed(0)) > Number.MAX_SAFE_INTEGER,
  }

  return (
    <PositionWrapper onClick={onClick}>
      <Row gap="8px">
        <DoubleTokenLogo chainId={positionInfo.chainId} tokens={tokens} size={16} />
        <ThemedText.SubHeader>
          {positionInfo.pool.token0.symbol}/{positionInfo.pool.token1.symbol}
        </ThemedText.SubHeader>
        <FeeTier>{positionInfo.pool.fee / BIPS_BASE}%</FeeTier>
        <StatusWrapper status={status}>
          <ThemedText.Caption color="inherit">{status}</ThemedText.Caption>
          {status === PositionStatus.IN_RANGE && <StyledDot />}
          {status === PositionStatus.OUT_OF_RANGE && <AlertTriangle size={12} color={theme.deprecated_accentWarning} />}
          {status === PositionStatus.CLOSED && <ClosedCircle />}
        </StatusWrapper>
      </Row>
      <RangeWrapper>
        <RangeText data-testid={`position-min-${priceLower.toFixed(0)}`}>
          <Trans>Min:</Trans>&nbsp;
          {formatTickPrice({
            price: priceLower,
            atLimit: ticksAtLimit,
            direction: Bound.LOWER,
          })}
          &nbsp;
          {positionInfo.pool.token0.symbol}&nbsp;
          <Trans>per</Trans>&nbsp;
          {positionInfo.pool.token1.symbol}
        </RangeText>
        <StyledDoubleArrow />
        <RangeText data-testid={`position-max-${priceUpper.toFixed(0)}`}>
          <Trans>Max:</Trans>&nbsp;
          {formatTickPrice({
            price: priceUpper,
            atLimit: ticksAtLimit,
            direction: Bound.UPPER,
          })}
          &nbsp;
          {positionInfo.pool.token0.symbol}&nbsp;
          <Trans>per</Trans>&nbsp;
          {positionInfo.pool.token1.symbol}
        </RangeText>
      </RangeWrapper>
    </PositionWrapper>
  )
}

export function PoolDetailsPositionsTable({ positions }: { positions: PositionInfo[] }) {
  return (
    <PositionTableWrapper>
      {positions.map((position, index) => (
        <PositionRow positionInfo={position} key={`pool-position-${index}`} />
      ))}
    </PositionTableWrapper>
  )
}
