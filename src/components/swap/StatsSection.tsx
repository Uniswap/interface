import { Trans } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { AutoRow } from 'components/Row'
import { ArrowCell } from 'components/Tokens/TokenDetails/PriceChart'
import { getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'
import { DeltaText } from 'components/Tokens/TokenDetails/PriceChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { getChainInfo } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { ReactNode } from 'react'
import styled from 'styled-components/macro'
import { ExternalLink, ThemedText } from 'theme'
import { textFadeIn } from 'theme/styles'

const UNSUPPORTED_METADATA_CHAINS = [SupportedChainId.BNB]

// import { UNSUPPORTED_METADATA_CHAINS } from '../constants'

 const StatWrapper = styled.div`
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  padding: 2px 0px;
`
const TokenStatsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`
const StatPair = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
`

const Header = styled(ThemedText.MediumHeader)`
  font-size: 28px !important;
`

const StatPrice = styled.div`
  margin-top: 2px;
  font-size: 18px;
  color: ${({ theme }) => theme.textPrimary};
`
const NoData = styled.div`
  color: ${({ theme }) => theme.textTertiary};
`
const StatsWrapper = styled.div`
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
  // inversePrice: boolean
  token0Symbol?: string
  token1Symbol?: string
  stats?: {
		price: number,
		delta: number,
		high24h: number,
		low24h: number,
		invertPrice: boolean,
		token1Reserve: number,
		token0Reserve: number
	}
  // priceHigh24H?: NumericStat
  // priceLow24H?: NumericStat
  // delta?: NumericStat
  // price?: NumericStat
  // token0Reserve?: number,
  // token1Reserve?: number
}
export default function StatsSection(props: StatsSectionProps) {
  const { chainId, address, stats, token0Symbol, token1Symbol } = props
  const { label, infoLink } = getChainInfo(chainId) ? getChainInfo(chainId) : { label: null,  infoLink: null }

  // if inversePrice then token0 is base token, otherwise token0 is quote token
  const arrow = getDeltaArrow(stats?.delta, 18)

  const baseQuoteSymbol = stats?.invertPrice ? `${token0Symbol} / ${token1Symbol}` : `${token1Symbol} / ${token0Symbol}`

  if (stats?.high24h || stats?.low24h || stats?.delta || stats?.price) {
    return (
      <StatsWrapper data-testid="token-details-stats">
        <TokenStatsSection>
          <StatPair>
            <Stat
              dataCy="current-price"
              value={stats?.price}
              description={
                <Trans>
                  Current Price
                </Trans>
              }
              isPrice={true}
              baseTokenSymbol={stats?.invertPrice ? token0Symbol : token1Symbol}
              title={<Trans>Current Price ({baseQuoteSymbol})</Trans>}
            />
            <StatWrapper data-cy="delta-24h">
              <MouseoverTooltip text={<Trans>
                The amount percentage change in asset over last 24 hours. 
              </Trans>}><Trans>24h Change</Trans></MouseoverTooltip>
              <StatPrice>
                <AutoRow>
                  <ArrowCell>
                    {arrow}
                  </ArrowCell>
                  <DeltaText delta={Number(stats?.delta)}>
                    {stats?.delta ? formatNumber(stats?.delta, NumberType.SwapTradeAmount) : "-"}%
                  </DeltaText>
                </AutoRow>
              </StatPrice>
            </StatWrapper>
          </StatPair>
          <StatPair>
            <Stat dataCy="24h-low" value={
              stats?.low24h
            } title={<Trans>24h low ({baseQuoteSymbol})</Trans>} />
            <Stat dataCy="24h-high" value={
              stats?.high24h
            } title={<Trans>24h high ({baseQuoteSymbol})</Trans>} />
          </StatPair>
          <StatPair>
            <Stat dataCy="liq-below" value={
              stats?.token1Reserve
            } title={<Trans>Liquidity Below ({token1Symbol})</Trans>} />
            <Stat dataCy="liq-above" value={
              stats?.token0Reserve
            } title={<Trans>Liquidity Above ({token0Symbol})</Trans>} />
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
