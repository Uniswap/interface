import { PositionInfo } from 'components/AccountDrawer/MiniPortfolio/Pools/cache'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { ClosedCircle, DoubleArrow } from 'components/Pools/PoolDetails/icons'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { BIPS_BASE } from 'constants/misc'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Bound } from 'state/mint/v3/actions'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { Trans, useTranslation } from 'uniswap/src/i18n'
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
  const { t } = useTranslation()
  const tokens = [
    useCurrency(positionInfo.details.token0, positionInfo.chainId),
    useCurrency(positionInfo.details.token1, positionInfo.chainId),
  ]
  const account = useAccount()
  const navigate = useNavigate()
  const switchChain = useSwitchChain()
  const theme = useTheme()
  const { formatTickPrice } = useFormatter()

  const onClick = useCallback(async () => {
    if (account.chainId !== positionInfo.chainId) {
      await switchChain(positionInfo.chainId)
    }
    navigate('/pool/' + positionInfo.details.tokenId)
  }, [navigate, positionInfo.chainId, positionInfo.details.tokenId, switchChain, account.chainId])

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
        <DoubleCurrencyLogo currencies={tokens} size={16} />
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
          <Trans i18nKey="pool.min.label" />
          &nbsp;
          {t('liquidityPool.positions.price', {
            amountWithSymbol: `${formatTickPrice({
              price: priceLower,
              atLimit: ticksAtLimit,
              direction: Bound.LOWER,
            })} ${positionInfo.pool.token0.symbol}`,
            outputToken: positionInfo.pool.token1.symbol,
          })}
        </RangeText>
        <StyledDoubleArrow />
        <RangeText data-testid={`position-max-${priceUpper.toFixed(0)}`}>
          <Trans i18nKey="pool.max.label" />
          &nbsp;
          {t('liquidityPool.positions.price', {
            amountWithSymbol: `${formatTickPrice({
              price: priceUpper,
              atLimit: ticksAtLimit,
              direction: Bound.UPPER,
            })} ${positionInfo.pool.token0.symbol}`,
            outputToken: positionInfo.pool.token1.symbol,
          })}
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
