// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { useGetRangeDisplay, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { PositionInfo } from 'components/Liquidity/types'
import { getPositionUrl, getProtocolStatusLabel } from 'components/Liquidity/utils'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { ClosedCircle, DoubleArrow } from 'components/Pools/PoolDetails/icons'
import Column from 'components/deprecated/Column'
import Row from 'components/deprecated/Row'
import { V2_BIPS } from 'graphql/data/pools/useTopPools'
import { useCurrency } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useSwitchChain } from 'hooks/useSwitchChain'
import styled, { useTheme } from 'lib/styled-components'
import { useCallback } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { BREAKPOINTS } from 'theme'
import { ClickableStyle, ThemedText } from 'theme/components'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

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

function PositionRow({ positionInfo }: { positionInfo: PositionInfo }) {
  const { t } = useTranslation()
  const poolOrPair = positionInfo.version === ProtocolVersion.V2 ? positionInfo.pair : positionInfo.pool
  const tokens = [
    useCurrency(poolOrPair?.token0.wrapped.address, positionInfo.chainId),
    useCurrency(poolOrPair?.token1.wrapped.address, positionInfo.chainId),
  ]
  const account = useAccount()
  const navigate = useNavigate()
  const switchChain = useSwitchChain()
  const theme = useTheme()
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)

  const onClick = useCallback(async () => {
    if (!isLPRedesignEnabled && account.chainId !== positionInfo.chainId) {
      await switchChain(positionInfo.chainId)
    }
    navigate(getPositionUrl(positionInfo))
  }, [isLPRedesignEnabled, account.chainId, positionInfo, navigate, switchChain])

  const status = positionInfo.status

  const fee =
    positionInfo.version === ProtocolVersion.V2
      ? V2_BIPS
      : typeof positionInfo.feeTier === 'string'
        ? parseFloat(positionInfo.feeTier)
        : positionInfo.feeTier ?? 0
  const { priceOrdering } = useV3OrV4PositionDerivedInfo(positionInfo)
  const { maxPrice, minPrice, tokenASymbol, tokenBSymbol } = useGetRangeDisplay({
    priceOrdering,
    feeTier: fee.toString(),
    tickLower: positionInfo.tickLower,
    tickUpper: positionInfo.tickUpper,
    pricesInverted: false,
  })

  return (
    <PositionWrapper onClick={onClick}>
      <Row gap="8px">
        <DoubleCurrencyLogo currencies={tokens} size={16} />
        <ThemedText.SubHeader>
          {poolOrPair?.token0.symbol}/{poolOrPair?.token1.symbol}
        </ThemedText.SubHeader>
        <FeeTier>{fee / BIPS_BASE}%</FeeTier>
        <StatusWrapper status={status}>
          <ThemedText.Caption color="inherit">{getProtocolStatusLabel(status, t)}</ThemedText.Caption>
          {status === PositionStatus.IN_RANGE && <StyledDot />}
          {status === PositionStatus.OUT_OF_RANGE && <AlertTriangle size={12} color={theme.deprecated_accentWarning} />}
          {status === PositionStatus.CLOSED && <ClosedCircle />}
        </StatusWrapper>
      </Row>
      {positionInfo.version !== ProtocolVersion.V2 && (
        <RangeWrapper>
          <RangeText data-testid={`position-min-${minPrice}`}>
            <Trans i18nKey="pool.min.label" />
            &nbsp;
            {t('liquidityPool.positions.price', {
              amountWithSymbol: `${minPrice} ${tokenASymbol}`,
              outputToken: tokenBSymbol,
            })}
          </RangeText>
          <StyledDoubleArrow />
          <RangeText data-testid={`position-max-${maxPrice}`}>
            <Trans i18nKey="pool.max.label" />
            &nbsp;
            {t('liquidityPool.positions.price', {
              amountWithSymbol: `${maxPrice} ${tokenASymbol}`,
              outputToken: tokenBSymbol,
            })}
          </RangeText>
        </RangeWrapper>
      )}
    </PositionWrapper>
  )
}

export function PoolDetailsPositionsTable({ positions }: { positions?: PositionInfo[] }) {
  return (
    <PositionTableWrapper>
      {positions?.map((position, index) => <PositionRow positionInfo={position} key={`pool-position-${index}`} />)}
    </PositionTableWrapper>
  )
}
