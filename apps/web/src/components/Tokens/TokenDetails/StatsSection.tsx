import { HEADER_DESCRIPTIONS } from 'components/Tokens/TokenTable'
import { UNSUPPORTED_METADATA_CHAINS } from 'components/Tokens/constants'
import { TokenSortMethod } from 'components/Tokens/state'
import { MouseoverTooltip } from 'components/Tooltip'
import { TokenQueryData } from 'graphql/data/Token'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { ExternalLink, ThemedText } from 'theme/components'
import { textFadeIn } from 'theme/styles'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export const StatWrapper = styled.div`
  color: ${({ theme }) => theme.neutral2};
  font-size: 14px;
  min-width: 121px;
  flex: 1;
  padding-top: 24px;
  padding-bottom: 0px;

  @media screen and (max-width: ${({ theme }) => theme.breakpoint.md}px) {
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
  chainId: UniverseChainId
  address: string
  tokenQueryData: TokenQueryData
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, tokenQueryData } = props
  const isSupportedChain = useIsSupportedChainId(chainId)
  const { label, infoLink } = isSupportedChain ? getChainInfo(chainId) : { label: undefined, infoLink: undefined }

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
              dataCy="tvl"
              value={TVL}
              description={<Trans i18nKey="stats.tvl.description" />}
              title={<Trans i18nKey="common.totalValueLocked" />}
            />
            <Stat
              dataCy="market-cap"
              value={marketCap}
              description={<Trans i18nKey="stats.marketCap.description" />}
              title={<Trans i18nKey="stats.marketCap" />}
            />
          </StatPair>
          <StatPair>
            <Stat
              dataCy="fdv"
              value={FDV}
              description={HEADER_DESCRIPTIONS[TokenSortMethod.FULLY_DILUTED_VALUATION]}
              title={<Trans i18nKey="stats.fdv" />}
            />
            <Stat
              dataCy="volume-24h"
              value={volume24H}
              description={<Trans i18nKey="stats.volume.1d.description" />}
              title={<Trans i18nKey="stats.volume.1d" />}
            />
          </StatPair>
        </TokenStatsSection>
      </StatsWrapper>
    )
  } else {
    return UNSUPPORTED_METADATA_CHAINS.includes(chainId) ? (
      <>
        <Header>
          <Trans i18nKey="common.stats" />
        </Header>
        <ThemedText.BodySecondary pt="12px">
          <Trans
            i18nKey="tdp.stats.unsupportedChainDescription"
            values={{
              chain: label,
              infoLink: (
                <ExternalLink color="currentColor" href={`${infoLink}tokens/${address}`}>
                  info.uniswap.org
                </ExternalLink>
              ),
            }}
          />
        </ThemedText.BodySecondary>
      </>
    ) : (
      <NoData data-cy="token-details-no-stats-data">No stats available</NoData>
    )
  }
}
