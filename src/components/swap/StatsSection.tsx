import { Trans } from '@lingui/macro'
import { formatNumber, formatUSDPrice, NumberType } from '@uniswap/conedison/format'
import { AutoRow } from 'components/Row'
import { ArrowCell } from 'components/Tokens/TokenDetails/PriceChart'
import { getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'
import { DeltaText } from 'components/Tokens/TokenDetails/PriceChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { base } from 'nft/css/reset.css'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'

export const UNSUPPORTED_METADATA_CHAINS = [SupportedChainId.BNB]

// import { UNSUPPORTED_METADATA_CHAINS } from '../constants'

export const StatWrapper = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  padding: 8px 0px;
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
  isPrice,
  baseTokenSymbol,
  quoteTokenSymbol
}: {
  dataCy: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
  isPrice?: boolean
  baseTokenSymbol?: string
  quoteTokenSymbol?: string
}) {
  let _value = value ? formatNumber(value, NumberType.FiatTokenPrice).replace(/\$/g, '') : "-";
  if (value && isPrice && baseTokenSymbol && quoteTokenSymbol) {
    _value = _value + ` ${baseTokenSymbol} / ${quoteTokenSymbol}`
  }
  return (
    <StatWrapper data-cy={`${dataCy}`}>
      <MouseoverTooltip text={description}>{title}</MouseoverTooltip>
      <StatPrice>{_value}</StatPrice>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  chainId: SupportedChainId
  address: string
  inversePrice: boolean
  token0Symbol?: string
  token1Symbol?: string
  priceHigh24H?: NumericStat
  priceLow24H?: NumericStat
  delta?: NumericStat
  price?: NumericStat
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, priceHigh24H, priceLow24H, delta, price, inversePrice, token0Symbol, token1Symbol } = props
  const { label, infoLink } = getChainInfo(chainId)

  // console.log('delta', delta)

  // if inversePrice then token0 is base token, otherwise token0 is quote token
  const arrow = getDeltaArrow(delta, 18)

  if (priceHigh24H || priceLow24H || delta || price) {
    return (
      <StatsWrapper data-testid="token-details-stats">
        {/* <Header>
          <Trans>Pool Stats</Trans>
        </Header> */}
        <TokenStatsSection>
          <StatPair>
            <Stat
              dataCy="current-price"
              value={price}
              description={
                <Trans>
                  Current Price
                </Trans>
              }
              isPrice={true}
              baseTokenSymbol={inversePrice ? token0Symbol : token1Symbol}
              title={<Trans>Current Price</Trans>}
            />
            <StatWrapper data-cy={"delta-24h"}>
              <MouseoverTooltip text={<Trans>
                The amount percentage change in asset over last 24 hours. 
              </Trans>}>{<Trans>24h Change</Trans>}</MouseoverTooltip>
              <StatPrice>
                <AutoRow>
                  <ArrowCell>
                    {arrow}
                  </ArrowCell>
                  <DeltaText delta={Number(delta)}>
                    {delta ? formatNumber(delta, NumberType.FiatTokenPrice).replace(/\$/g, '') : "-"}%
                  </DeltaText>
                </AutoRow>

              </StatPrice>
            </StatWrapper>
            {/* <Stat
              dataCy="delta-24h"
              value={delta}
              description={
                <Trans>
                  24H volume is the amount of the asset that has been traded on Uniswap v3 during the past 24 hours.
                </Trans>
              }
              title={<Trans>24h Change</Trans>}
            /> */}
          </StatPair>
          <StatPair>
            <Stat dataCy="24h-low" value={
              priceLow24H
            } title={<Trans>24h low</Trans>} />
            <Stat dataCy="24h-high" value={
              priceHigh24H
            } title={<Trans>24h high</Trans>} />
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
