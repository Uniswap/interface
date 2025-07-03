import { TokenQueryData } from 'appGraphql/data/Token'
import { HEADER_DESCRIPTIONS } from 'components/Tokens/TokenTable'
import { TokenSortMethod } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export const StatWrapper = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  min-width: 121px;
  flex: 1;
  padding-top: 24px;
  padding-bottom: 0px;
`
const TokenStatsSection = styled.div`
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
  padding-top: 40px;
`

const StatPrice = styled.div`
  margin-top: 4px;
  font-size: 28px;
  color: ${({ theme }) => theme.neutral1};
`
const NoData = styled.div`
  color: ${({ theme }) => theme.neutral3};
  padding-top: 40px;
`
export const StatsWrapper = styled.div`
  gap: 16px;
  ${textFadeIn}
`

type NumericStat = number | undefined | null

function Stat({
  testID,
  value,
  title,
  description,
}: {
  testID: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <StatWrapper data-cy={`${testID}`} data-testid={`${testID}`}>
      <MouseoverTooltip disabled={!description} text={description}>
        {title}
      </MouseoverTooltip>
      <StatPrice>{convertFiatAmountFormatted(value, NumberType.FiatTokenStats)}</StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  tokenQueryData: TokenQueryData
}
export default function StatsSection(props: StatsSectionProps) {
  const { tokenQueryData } = props

  const tokenMarketInfo = tokenQueryData?.market
  const tokenProjectMarketInfo = tokenQueryData?.project?.markets?.[0] // aggregated market price from CoinGecko

  const FDV = tokenProjectMarketInfo?.fullyDilutedValuation?.value
  const marketCap = tokenProjectMarketInfo?.marketCap?.value
  const TVL = tokenMarketInfo?.totalValueLocked?.value
  const volume24H = tokenMarketInfo?.volume24H?.value

  const hasStats = TVL || FDV || marketCap || volume24H

  if (hasStats) {
    return (
      <StatsWrapper data-testid="token-details-stats">
        <Header>
          <Trans i18nKey="common.stats" />
        </Header>
        <TokenStatsSection>
          <StatPair>
            <Stat
              testID="tvl"
              value={TVL}
              description={<Trans i18nKey="stats.tvl.description" />}
              title={<Trans i18nKey="common.totalValueLocked" />}
            />
            <Stat
              testID="market-cap"
              value={marketCap}
              description={<Trans i18nKey="stats.marketCap.description" />}
              title={<Trans i18nKey="stats.marketCap" />}
            />
          </StatPair>
          <StatPair>
            <Stat
              testID="fdv"
              value={FDV}
              description={HEADER_DESCRIPTIONS[TokenSortMethod.FULLY_DILUTED_VALUATION]}
              title={<Trans i18nKey="stats.fdv" />}
            />
            <Stat
              testID="volume-24h"
              value={volume24H}
              description={<Trans i18nKey="stats.volume.1d.description" />}
              title={<Trans i18nKey="stats.volume.1d" />}
            />
          </StatPair>
        </TokenStatsSection>
      </StatsWrapper>
    )
  } else {
    return <NoData data-cy="token-details-no-stats-data">No stats available</NoData>
  }
}
