import { Trans } from '@lingui/macro'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ThemedText } from 'theme'
import { textFadeIn } from 'theme/animations'
import { formatDollar } from 'utils/formatNumbers'

import { TokenSortMethod } from '../state'
import { HEADER_DESCRIPTIONS } from '../TokenTable/TokenRow'
import InfoTip from './InfoTip'

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

const Header = styled(ThemedText.MediumHeader)`
  font-size: 28px !important;
`
const StatTitle = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
`
const StatPrice = styled.span`
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
const NoData = styled.div`
  color: ${({ theme }) => theme.textTertiary};
`
const Wrapper = styled.div`
  gap: 16px;
  ${textFadeIn}
`

type NumericStat = number | undefined | null

function Stat({
  value,
  title,
  description,
  isPrice = false,
}: {
  value: NumericStat
  title: ReactNode
  description?: ReactNode
  isPrice?: boolean
}) {
  return (
    <StatWrapper>
      <StatTitle>
        {title}
        {description && <InfoTip text={description}></InfoTip>}
      </StatTitle>

      <StatPrice>{formatDollar({ num: value, isPrice })}</StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  priceLow52W?: NumericStat
  priceHigh52W?: NumericStat
  TVL?: NumericStat
  volume24H?: NumericStat
}
export default function StatsSection(props: StatsSectionProps) {
  const { priceLow52W, priceHigh52W, TVL, volume24H } = props
  if (TVL || volume24H || priceLow52W || priceHigh52W) {
    return (
      <Wrapper>
        <Header>
          <Trans>Stats</Trans>
        </Header>
        <TokenStatsSection>
          <StatPair>
            <Stat
              value={TVL}
              description={HEADER_DESCRIPTIONS[TokenSortMethod.TOTAL_VALUE_LOCKED]}
              title={<Trans>TVL</Trans>}
            />
            <Stat
              value={volume24H}
              description={
                <Trans>
                  24H volume is the amount of the asset that has been traded on Uniswap v3 during the past 24 hours.
                </Trans>
              }
              title={<Trans>24H volume</Trans>}
            />
          </StatPair>
          <StatPair>
            <Stat value={priceLow52W} title={<Trans>52W low</Trans>} isPrice={true} />
            <Stat value={priceHigh52W} title={<Trans>52W high</Trans>} isPrice={true} />
          </StatPair>
        </TokenStatsSection>
      </Wrapper>
    )
  } else {
    return <NoData>No stats available</NoData>
  }
}
