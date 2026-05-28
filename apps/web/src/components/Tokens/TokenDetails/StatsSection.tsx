/* eslint-disable @typescript-eslint/no-unused-vars, unused-imports/no-unused-imports */
import { UNSUPPORTED_METADATA_CHAINS } from 'components/Tokens/constants'
import { MouseoverTooltip } from 'components/Tooltip'
import styled from 'lib/styled-components'
import { ReactNode, useMemo } from 'react'
import { Trans } from 'react-i18next'
import { ThemedText } from 'theme/components'
import { ExternalLink } from 'theme/components/Links'
import { textFadeIn } from 'theme/styles'
import { Token } from 'uniswap/src/data/graphql/ringswap-data-api/__generated__/types-and-hooks'
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
  const { formatNumber } = useFormatter()

  return (
    <StatWrapper data-cy={`${testID}`} data-testid={`${testID}`}>
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

function StatAmount({
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
  const { formatNumber } = useFormatter()

  return (
    <StatWrapper data-cy={`${testID}`} data-testid={`${testID}`}>
      <MouseoverTooltip disabled={!description} text={description}>
        {title}
      </MouseoverTooltip>
      <StatPrice>
        {formatNumber({
          input: value,
          type: NumberType.TokenQuantityStats,
        })}
      </StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  chainId: UniverseChainId
  address: string
  tokenQueryData: Token
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, tokenQueryData } = props
  const isSupportedChain = useIsSupportedChainId(chainId)
  const { label, infoLink } = isSupportedChain ? getChainInfo(chainId) : { label: undefined, infoLink: undefined }

  const timestamp = useMemo(() => Math.floor(Date.now() / 1000), [])
  const SECONDS_IN_24_HOURS = 86400
  const volume24H = useMemo(() => {
    if (!tokenQueryData?.hourData?.items) {
      return null
    }
    return tokenQueryData.hourData.items
      .filter((item) => item.date >= Number(timestamp) - SECONDS_IN_24_HOURS)
      .reduce((acc, cur) => acc + Number(cur.volumeUSD), 0)
  }, [tokenQueryData?.hourData?.items, timestamp])
  const TVL = Number(tokenQueryData?.totalValueLockedUSD)
  const amount = Number(tokenQueryData?.totalValueLocked)

  const hasStats = TVL || amount || volume24H

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
            <StatAmount testID="market-amount" value={amount} title={<Trans i18nKey="common.tokenAmount" />} />
          </StatPair>
          <StatPair>
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
