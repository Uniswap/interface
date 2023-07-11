import { Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { ChainId } from '@thinkincoin-libs/sdk-core'
import { MouseoverTooltip } from 'components/Tooltip'
import { getChainInfo } from 'constants/chainInfo'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'

import { UNSUPPORTED_METADATA_CHAINS } from '../constants'
import { TokenSortMethod } from '../state'
import { HEADER_DESCRIPTIONS } from '../TokenTable/TokenRow'

export const StatWrapper = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  padding: 24px 0px;
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
`

const StatPrice = styled.div`
  margin-top: 4px;
  font-size: 28px;
  color: ${({ theme }) => theme.textPrimary};
`
const NoData = styled.div`
  color: ${({ theme }) => theme.textTertiary};
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
  return (
    <StatWrapper data-cy={`${dataCy}`}>
      <MouseoverTooltip text={description}>{title}</MouseoverTooltip>
      <StatPrice>{formatNumber(value, NumberType.FiatTokenStats)}</StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  chainId: ChainId
  address: string
  priceLow52W?: NumericStat
  priceHigh52W?: NumericStat
  TVL?: NumericStat
  volume24H?: NumericStat
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, priceLow52W, priceHigh52W, TVL, volume24H } = props
  const { label, infoLink } = getChainInfo(chainId)

  if (TVL || volume24H || priceLow52W || priceHigh52W) {
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
              description={HEADER_DESCRIPTIONS[TokenSortMethod.TOTAL_VALUE_LOCKED]}
              title={<Trans>TVL</Trans>}
            />
            <Stat
              dataCy="volume-24h"
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
            <Stat dataCy="52w-low" value={priceLow52W} title={<Trans>52W low</Trans>} />
            <Stat dataCy="52w-high" value={priceHigh52W} title={<Trans>52W high</Trans>} />
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
        <ThemedText.BodySecondary paddingTop="12px">
          <Trans>
            Token stats and charts for {label} are available on{' '}
            <ExternalLink color="currentColor" href={`${infoLink}tokens/${address}`}>
              info.uniswap.org
            </ExternalLink>
          </Trans>
        </ThemedText.BodySecondary>
      </>
    ) : (
      <NoData>No stats available</NoData>
    )
  }
}
