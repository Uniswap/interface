import type { TFunction } from 'i18next'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, FlexProps, styled, Text } from 'ui/src'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useTokenMarketStats, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { TokenQueryData } from '~/appGraphql/data/Token'
import { getHeaderDescription, TokenSortMethod } from '~/components/Tokens/constants'
import { LoadingBubble } from '~/components/Tokens/loading'
import { MouseoverTooltip } from '~/components/Tooltip'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPPreferProjectMarketData } from '~/pages/TokenDetails/hooks/useTDPPreferProjectMarketData'
import { useTDPStatsMarketSource } from '~/pages/TokenDetails/hooks/useTDPStatsMarketSource'

const STATS_GAP = '$gap20'

function getVolumeDescription({
  t,
  isProjectVolume,
  chainId,
}: {
  t: TFunction
  isProjectVolume: boolean
  chainId: UniverseChainId
}): string {
  if (isProjectVolume) {
    return t('stats.volume.1d.description.coingecko')
  }
  if (chainId === UniverseChainId.Tempo) {
    return t('stats.volume.1d.description.tempo')
  }
  return t('stats.volume.1d.description')
}

export const StatWrapper = ({
  tableRow = false,
  children,
  ...props
}: { tableRow?: boolean; children: ReactNode } & FlexProps) => (
  <Flex
    tag={tableRow ? 'tr' : 'div'}
    flexBasis="33.33%"
    flexGrow={0}
    flexShrink={0}
    pr="$spacing12"
    $sm={{ flexBasis: '50%' }}
    {...props}
  >
    {children}
  </Flex>
)

export const StatsWrapper = ({ children, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex animation="200ms" animateEnter="fadeIn" gap={STATS_GAP} {...props}>
    {children}
  </Flex>
)

const TokenStatsSection = ({ children }: { children: ReactNode }) => (
  <Flex row flexWrap="wrap" rowGap="$spacing24" tag="table">
    {children}
  </Flex>
)

const StatsLoadingContainer = styled(Flex, {
  row: true,
  flexWrap: 'wrap',
  rowGap: '$spacing24',
  width: '100%',
})

function LoadingStatTile() {
  return (
    <StatWrapper>
      <LoadingBubble height={16} width={80} containerProps={{ mb: '$spacing4' }} />
      <LoadingBubble height={32} width={116} skeletonProps={{ borderRadius: '$rounded8' }} />
    </StatWrapper>
  )
}

// Loading state for the stats section, reused by the full-page TDP skeleton so the placeholder is
// identical in both. It lives here next to StatWrapper/StatsWrapper (which it reuses for dimensional
// parity) and is built on the cycle-safe LoadingBubble primitive, so the section owns its own loading
// UI without a Skeleton <-> StatsSection import cycle.
export function LoadingStats() {
  return (
    <StatsWrapper data-testid="token-details-stats-loading">
      <LoadingBubble height={32} width={120} skeletonProps={{ borderRadius: '$rounded8' }} />
      <StatsLoadingContainer>
        <LoadingStatTile />
        <LoadingStatTile />
        <LoadingStatTile />
        <LoadingStatTile />
        <LoadingStatTile />
        <LoadingStatTile />
      </StatsLoadingContainer>
    </StatsWrapper>
  )
}

type NumericStat = number | undefined | null

function Stat({
  testID,
  value,
  title,
  description,
  numberType = NumberType.FiatTokenStats,
}: {
  testID: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
  numberType?: FiatNumberType
}) {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const formattedValue = convertFiatAmountFormatted(value, numberType)

  return (
    <StatWrapper tableRow data-cy={`${testID}`} data-testid={`${testID}`}>
      <Text variant="body3" color="$neutral2" tag="td">
        <MouseoverTooltip disabled={!description} text={description}>
          {/* Wrap in a colored Text: MouseoverTooltip re-wraps string children in its own uncolored Text, which would otherwise default the label to $neutral1. */}
          <Text variant="body3" color="$neutral2">
            {title}
          </Text>
        </MouseoverTooltip>
      </Text>
      <Flex tag="td" mt="$spacing8" data-testid={`${testID}-value`} $platform-web={{ overflowWrap: 'break-word' }}>
        <AnimatedNumber numericValue={value ?? undefined} textVariant="$heading3" value={formattedValue} />
      </Flex>
    </StatWrapper>
  )
}

type StatsSectionProps = {
  tokenQueryData: TokenQueryData | undefined
  /** The heavy market query is still in flight. Renders the loading skeleton instead of the empty state. */
  isLoading?: boolean
}

export function StatsSection({ tokenQueryData, isLoading = false }: StatsSectionProps) {
  const { t } = useTranslation()
  const effectiveCurrency = useTDPEffectiveCurrency()

  const { showAggregatedStats, filteredDeploymentMarket, networkFilterName, marketStatsInput } =
    useTDPStatsMarketSource(tokenQueryData)

  const currencyIdValue = useMemo(() => currencyId(effectiveCurrency), [effectiveCurrency])
  const preferProjectMarketData = useTDPPreferProjectMarketData()
  const spotPrice = useTokenSpotPrice(currencyIdValue, { preferProjectMarketData })

  const stats = useTokenMarketStats(currencyIdValue, {
    aggregatedData: marketStatsInput,
    currentPriceOverride: spotPrice,
    preferProjectMarketData,
  })

  const tokenMarketVolume = showAggregatedStats
    ? tokenQueryData?.market?.volume24H?.value
    : filteredDeploymentMarket?.volume24H?.value
  const volume = preferProjectMarketData ? (stats.volume ?? tokenMarketVolume) : (tokenMarketVolume ?? stats.volume)
  // Guard against the second fallback below: `volume` can drop to the Uniswap value even when `stats.volumeSource` is 'project'.
  const isProjectVolume = stats.volumeSource === 'project' && volume === stats.volume
  const tvl = showAggregatedStats
    ? tokenQueryData?.market?.totalValueLocked?.value
    : filteredDeploymentMarket?.totalValueLocked?.value
  const { marketCap, fdv, high52w, low52w } = stats

  const hasStats = tvl || fdv || marketCap || volume || high52w || low52w

  if (hasStats) {
    return (
      <StatsWrapper data-testid={TestID.TokenDetailsStats}>
        <Text variant="heading3">{t('common.stats')}</Text>
        <TokenStatsSection>
          <Stat
            testID={TestID.TokenDetailsStatsTvl}
            value={tvl}
            description={
              networkFilterName
                ? t('stats.tvl.description.network', {
                    symbol: effectiveCurrency.symbol,
                    network: networkFilterName,
                  })
                : t('stats.tvl.description', { symbol: effectiveCurrency.symbol })
            }
            title={t('common.totalValueLocked')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsMarketCap}
            value={marketCap}
            description={t('stats.marketCap.description')}
            title={t('stats.marketCap')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsFdv}
            value={fdv}
            description={getHeaderDescription({ t, category: TokenSortMethod.FULLY_DILUTED_VALUATION })}
            title={t('stats.fdv')}
          />
          <Stat
            testID={TestID.TokenDetailsStatsVolume24h}
            value={volume}
            description={getVolumeDescription({
              t,
              isProjectVolume,
              chainId: effectiveCurrency.chainId,
            })}
            title={t('stats.volume.1d')}
          />
          <Stat
            testID={TestID.TokenDetailsStats52wHigh}
            value={high52w}
            title={t('token.stats.priceHighYear')}
            numberType={NumberType.FiatTokenDetails}
          />
          <Stat
            testID={TestID.TokenDetailsStats52wLow}
            value={low52w}
            title={t('token.stats.priceLowYear')}
            numberType={NumberType.FiatTokenDetails}
          />
        </TokenStatsSection>
      </StatsWrapper>
    )
  }
  if (isLoading) {
    return <LoadingStats />
  }
  return (
    <Text color="$neutral3" pt="$spacing40" data-cy="token-details-no-stats-data">
      {t('stats.noStatsAvailable')}
    </Text>
  )
}
