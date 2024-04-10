import { Trans } from '@lingui/macro'
import { ChainId } from '@uniswap/sdk-core'
import { MouseoverTooltip } from 'components/Tooltip'
import { getChainInfo } from 'constants/chainInfo'
import { TokenQueryData } from 'graphql/data/Token'
import { ReactNode } from 'react'
import styled from 'styled-components'
import { ExternalLink, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { HEADER_DESCRIPTIONS } from 'components/Tokens/TokenTable'
import { UNSUPPORTED_METADATA_CHAINS } from '../constants'
import { TokenSortMethod } from '../state'

export const StatWrapper = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  min-width: 121px;
  flex: 1;
  padding-top: 24px;
  padding-bottom: 0px;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.sm}px) {
    min-width: 168px;
  }
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
  dataCy,
  value,
  title,
  description,
}: {
  dataCy: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
}) {
  const { formatNumber } = useFormatter()

  return (
    <StatWrapper data-cy={`${dataCy}`}>
      <MouseoverTooltip disabled={!description} text={description}>
        {title}
      </MouseoverTooltip>
      <StatPrice>
        {formatNumber({
          input: value,
          type: NumberType.FiatTokenStats,
        })}
      </StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  chainId: ChainId
  address: string
  tokenQueryData: TokenQueryData
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, tokenQueryData } = props
  const { label, infoLink } = getChainInfo(chainId)

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
          <Trans>Stats</Trans>
        </Header>
        <TokenStatsSection>
          <StatPair>
            <Stat
              dataCy="tvl"
              value={TVL}
              description={
                <Trans>
                  Total value locked (TVL) is the aggregate amount of the asset available across all Uniswap v3
                  liquidity pools.
                </Trans>
              }
              title={<Trans>TVL</Trans>}
            />
            <Stat
              dataCy="market-cap"
              value={marketCap}
              description={
                <Trans>Market capitalization is the total market value of an asset&apos;s circulating supply.</Trans>
              }
              title={<Trans>Market cap</Trans>}
            />
          </StatPair>
          <StatPair>
            <Stat
              dataCy="fdv"
              value={FDV}
              description={HEADER_DESCRIPTIONS[TokenSortMethod.FULLY_DILUTED_VALUATION]}
              title={<Trans>FDV</Trans>}
            />
            <Stat
              dataCy="volume-24h"
              value={volume24H}
              description={
                <Trans>
                  1 day volume is the amount of the asset that has been traded on Uniswap v3 during the past 24 hours.
                </Trans>
              }
              title={<Trans>1 day volume</Trans>}
            />
          </StatPair>
        </TokenStatsSection>
      </StatsWrapper>
    )
  } else {
    return UNSUPPORTED_METADATA_CHAINS.includes(chainId) ? (
      <>
        <Header>
          <Trans>Stats</Trans>
        </Header>
        <ThemedText.BodySecondary pt="12px">
          <Trans>
            Token stats and charts for {label} are available on{' '}
            <ExternalLink color="currentColor" href={`${infoLink}tokens/${address}`}>
              info.uniswap.org
            </ExternalLink>
          </Trans>
        </ThemedText.BodySecondary>
      </>
    ) : (
      <NoData data-cy="token-details-no-stats-data">No stats available</NoData>
    )
  }
}
