import { Trans } from '@lingui/macro'
import Column from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { PoolData } from 'graphql/thegraph/PoolData'
import { useCurrency } from 'hooks/Tokens'
import { useColor } from 'hooks/useColor'
import { useScreenSize } from 'hooks/useScreenSize'
import { ReactNode, useMemo } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'
import { BREAKPOINTS } from 'theme'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const HeaderText = styled(Text)`
  font-weight: 485;
  font-size: 24px;
  line-height: 36px;
  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    width: 100%;
  }
`

const StatsWrapper = styled(Column)`
  gap: 24px;
  padding: 20px;
  border-radius: 20px;
  background: ${({ theme }) => theme.surface2};
  width: 100%;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: row;
    background: ${({ theme }) => theme.surface1};
    flex-wrap: wrap;
    padding: 20px 0px;
    justify-content: space-between;
  }
`

const StatItemColumn = styled(Column)`
  gap: 8px;
  flex: 1;
  min-width: 180px;

  @media (max-width: ${BREAKPOINTS.sm}px) {
    min-width: 150px;
  }
`

const PoolBalanceSymbols = styled(Row)`
  justify-content: space-between;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
  }
`

const PoolBalanceTokenNames = styled(Row)`
  font-weight: 485;
  font-size: 18px;
  line-height: 24px;
  width: max-content;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    font-size: 20px;
    line-height: 28px;
    width: 100%;
  }
`

const leftBarChartStyles = css`
  border-top-left-radius: 5px;
  border-bottom-left-radius: 5px;
  border-right: 1px solid ${({ theme }) => theme.surface2};
`

const rightBarChartStyles = css`
  border-top-right-radius: 5px;
  border-bottom-right-radius: 5px;
  border-left: 1px solid ${({ theme }) => theme.surface2};
`

const BalanceChartSide = styled.div<{ percent: number; $color: string; isLeft: boolean }>`
  height: 8px;
  width: ${({ percent }) => percent * 100}%;
  background: ${({ $color }) => $color};
  ${({ isLeft }) => (isLeft ? leftBarChartStyles : rightBarChartStyles)}
`

interface PoolDetailsStatsProps {
  poolData: PoolData
  isReversed: boolean
  chainId?: number
}

export function PoolDetailsStats({ poolData, isReversed, chainId }: PoolDetailsStatsProps) {
  const isScreenSize = useScreenSize()
  const screenIsNotLarge = isScreenSize['lg']
  const { formatNumber } = useFormatter()

  const currency0 = useCurrency(poolData?.token0?.id, chainId) ?? undefined
  const currency1 = useCurrency(poolData?.token1?.id, chainId) ?? undefined

  const color0 = useColor(currency0?.wrapped)
  const color1 = useColor(currency1?.wrapped)

  const [token0, token1] = useMemo(() => {
    const fullWidth = poolData?.tvlToken0 / poolData?.token0Price + poolData?.tvlToken1
    const token0FullData = {
      ...poolData?.token0,
      price: poolData?.token0Price,
      tvl: poolData?.tvlToken0,
      color: color0,
      percent: poolData?.tvlToken0 / poolData?.token0Price / fullWidth,
      currency: currency0,
    }
    const token1FullData = {
      ...poolData?.token1,
      price: poolData?.token1Price,
      tvl: poolData?.tvlToken1,
      color: color1,
      percent: poolData?.tvlToken1 / fullWidth,
      currency: currency1,
    }
    return isReversed ? [token1FullData, token0FullData] : [token0FullData, token1FullData]
  }, [color0, color1, currency0, currency1, isReversed, poolData])

  return (
    <StatsWrapper>
      <HeaderText>
        <Trans>Stats</Trans>
      </HeaderText>
      <StatItemColumn>
        <ThemedText.BodySecondary>
          <Trans>Pool balances</Trans>
        </ThemedText.BodySecondary>
        <PoolBalanceSymbols>
          <PoolBalanceTokenNames>
            {!screenIsNotLarge && (
              <CurrencyLogo currency={token0.currency} size="20px" style={{ marginRight: '8px' }} />
            )}
            {formatNumber({
              input: token0.tvl,
              type: NumberType.TokenNonTx,
            })}
            &nbsp;
            {token0.symbol}
          </PoolBalanceTokenNames>
          <PoolBalanceTokenNames>
            {!screenIsNotLarge && (
              <CurrencyLogo currency={token1.currency} size="20px" style={{ marginRight: '8px' }} />
            )}
            {formatNumber({
              input: token1.tvl,
              type: NumberType.TokenNonTx,
            })}
            &nbsp;
            {token1.symbol}
          </PoolBalanceTokenNames>
        </PoolBalanceSymbols>
        {screenIsNotLarge && (
          <Row data-testid="pool-balance-chart">
            {token0.color && <BalanceChartSide percent={token0.percent} $color={token0.color} isLeft={true} />}
            {token1.color && <BalanceChartSide percent={token1.percent} $color={token1.color} isLeft={false} />}
          </Row>
        )}
      </StatItemColumn>
      <StatItem title={<Trans>TVL</Trans>} value={poolData.tvlUSD} delta={poolData.tvlUSDChange} />
      <StatItem title={<Trans>24H volume</Trans>} value={poolData.volumeUSD} delta={poolData.volumeUSDChange} />
      <StatItem title={<Trans>24H fees</Trans>} value={poolData.volumeUSD * (poolData.feeTier / 1000000)} />
    </StatsWrapper>
  )
}

const StatsTextContainer = styled(Row)`
  gap: 4px;
  width: 100%;
  align-items: flex-end;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    flex-direction: column;
    gap: 0px;
    align-items: flex-start;
  }
`

const StatItemText = styled(Text)`
  color: ${({ theme }) => theme.neutral1};
  font-size: 36px;
  font-weight: 485;
  line-height: 44px;

  @media (max-width: ${BREAKPOINTS.lg - 1}px) {
    font-size: 20px;
    line-height: 28px;
  }
`

function StatItem({ title, value, delta }: { title: ReactNode; value: number; delta?: number }) {
  const { formatNumber, formatPercent } = useFormatter()

  return (
    <StatItemColumn>
      <ThemedText.BodySecondary>{title}</ThemedText.BodySecondary>
      <StatsTextContainer>
        <StatItemText>
          {formatNumber({
            input: value,
            type: NumberType.FiatTokenStats,
          })}
        </StatItemText>
        {!!delta && (
          <Row width="max-content" padding="4px 0px">
            <DeltaArrow delta={delta} />
            <ThemedText.BodySecondary>{formatPercent(delta)}</ThemedText.BodySecondary>
          </Row>
        )}
      </StatsTextContainer>
    </StatItemColumn>
  )
}
