import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { formatDollarAmount } from 'utils/formatDollarAmt'

export const StatWrapper = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  gap: 4px;
  padding: 24px 0px;
`
export const TokenStatsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`
export const StatPair = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
const NoData = styled.div`
  color: ${({ theme }) => theme.textTertiary};
`

type NumericStat = number | undefined | null

function Stat({ value, title }: { value: NumericStat; title: ReactNode }) {
  return (
    <StatWrapper>
      {title}
      <StatPrice>{value ? formatDollarAmount(value) : '-'}</StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  marketCap?: NumericStat
  volume24H?: NumericStat
  priceLow52W?: NumericStat
  priceHigh52W?: NumericStat
}
export default function StatsSection({ marketCap, volume24H, priceLow52W, priceHigh52W }: StatsSectionProps) {
  if (marketCap || volume24H || priceLow52W || priceHigh52W) {
    return (
      <TokenStatsSection>
        <StatPair>
          <Stat value={marketCap} title={<Trans>Market Cap</Trans>} />
          <Stat value={volume24H} title={<Trans>24H volume</Trans>} />
        </StatPair>
        <StatPair>
          <Stat value={priceLow52W} title={<Trans>52W low</Trans>} />
          <Stat value={priceHigh52W} title={<Trans>52W high</Trans>} />
        </StatPair>
      </TokenStatsSection>
    )
  } else {
    return <NoData>No stats available</NoData>
  }
}
