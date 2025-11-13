import { Trans } from '@lingui/macro'
import styled from 'styled-components'
import { ThemedText } from 'theme'
import { useProtocolStatsTaiko } from 'graphql/taiko/TaikoTopPools'
import { useMemo } from 'react'

const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
`

const StatCard = styled.div`
  background: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const StatLabel = styled(ThemedText.BodySecondary)`
  font-size: 14px;
  font-weight: 485;
`

const StatValue = styled(ThemedText.HeadlineLarge)`
  font-size: 28px;
  font-weight: 535;
`

const StatChange = styled.span<{ $positive?: boolean }>`
  font-size: 12px;
  font-weight: 535;
  color: ${({ theme, $positive }) => ($positive ? theme.success : theme.critical)};
`

function formatNumber(value: number | undefined): string {
  if (value === undefined) return '-'

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

function formatCount(value: number | undefined): string {
  if (value === undefined) return '-'
  return value.toLocaleString()
}

export function ProtocolStats() {
  const { stats, loading } = useProtocolStatsTaiko()

  const formattedStats = useMemo(() => {
    if (!stats) return null

    return {
      totalVolume: formatNumber(stats.totalVolumeUSD),
      totalTVL: formatNumber(stats.totalValueLockedUSD),
      totalFees: formatNumber(stats.totalFeesUSD),
      poolCount: formatCount(stats.poolCount),
      txCount: formatCount(stats.txCount),
    }
  }, [stats])

  if (loading || !formattedStats) {
    return (
      <StatsContainer>
        <StatCard>
          <StatLabel>
            <Trans>Loading...</Trans>
          </StatLabel>
        </StatCard>
      </StatsContainer>
    )
  }

  return (
    <StatsContainer>
      <StatCard>
        <StatLabel>
          <Trans>Total Volume</Trans>
        </StatLabel>
        <StatValue>{formattedStats.totalVolume}</StatValue>
      </StatCard>

      <StatCard>
        <StatLabel>
          <Trans>Total TVL</Trans>
        </StatLabel>
        <StatValue>{formattedStats.totalTVL}</StatValue>
      </StatCard>

      <StatCard>
        <StatLabel>
          <Trans>Total Fees</Trans>
        </StatLabel>
        <StatValue>{formattedStats.totalFees}</StatValue>
      </StatCard>

      <StatCard>
        <StatLabel>
          <Trans>Pools</Trans>
        </StatLabel>
        <StatValue>{formattedStats.poolCount}</StatValue>
      </StatCard>

      <StatCard>
        <StatLabel>
          <Trans>Transactions</Trans>
        </StatLabel>
        <StatValue>{formattedStats.txCount}</StatValue>
      </StatCard>
    </StatsContainer>
  )
}
