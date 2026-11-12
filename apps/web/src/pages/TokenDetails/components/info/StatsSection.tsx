import { cn, Flex, FlexProps, Text } from '@universe/mycelium'
import { curveToAnimationTiming, ENTER_PRESET_CLASSES } from '@universe/mycelium/compat'
import { styled } from '@universe/mycelium/styled'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TestID } from '@universe/test'
import { ReactNode, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import {
  getTokenTvlBreakdown,
  type TokenTvlBreakdown,
} from 'uniswap/src/features/dataApi/tokenDetails/tokenMarketStatsUtils'
import { useTokenMarketStats, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { FiatNumberType, NumberType } from 'utilities/src/format/types'
import { getHeaderDescription, TokenSortMethod } from '~/components/Tokens/constants'
import { LoadingBubble } from '~/components/Tokens/loading'
import { MouseoverTooltip, TooltipSize } from '~/components/Tooltip'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPMultichainAggregate } from '~/pages/TokenDetails/hooks/useTDPMultichainAggregate'

const STATS_GAP = '$gap20'

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

// Timing of the legacy 200ms Tamagui curve, applied so the enter keyframe below runs on it
// instead of the preset's pinned default.
const STATS_ENTER_TIMING = curveToAnimationTiming(SPORE_ANIMATION_CURVE_CSS['200ms'])

export const StatsWrapper = ({ children, className, style, ...props }: { children: ReactNode } & FlexProps) => (
  <Flex
    className={cn(ENTER_PRESET_CLASSES.fadeIn, className)}
    style={style ? [STATS_ENTER_TIMING, style] : STATS_ENTER_TIMING}
    gap={STATS_GAP}
    {...props}
  >
    {children}
  </Flex>
)

const TokenStatsSection = ({ children }: { children: ReactNode }) => (
  <Flex row flexWrap="wrap" rowGap="$spacing24" tag="table">
    {children}
  </Flex>
)

const StatsLoadingContainer = styled(Flex, {
  base: 'flex-row flex-wrap gap-y-[24px] w-[100%]',
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

function TvlBreakdownRow({ label, value }: { label: string; value: number }) {
  const { convertFiatAmountFormatted } = useLocalizationContext()

  return (
    <Flex row justifyContent="space-between" gap="$spacing36">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Text variant="body3" color="$neutral1" textAlign="right">
        {convertFiatAmountFormatted(value, NumberType.FiatStandardNoDecimals)}
      </Text>
    </Flex>
  )
}

function TvlBreakdownTooltipContent({ breakdown, symbol }: { breakdown: TokenTvlBreakdown; symbol: string }) {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing8" data-testid={TestID.TokenDetailsStatsTvlBreakdown}>
      <Flex gap="$spacing4">
        <TvlBreakdownRow label={t('token.stats.tvl.tokenInPools', { symbol })} value={breakdown.tokenTvl} />
        <TvlBreakdownRow label={t('token.stats.tvl.pairedTokens')} value={breakdown.pairedTvl} />
      </Flex>
      <Flex borderTopWidth="$spacing1" borderColor="$surface3" pt="$spacing8" pb="$spacing4">
        <TvlBreakdownRow label={t('token.stats.tvl.allPools', { symbol })} value={breakdown.poolsTvl} />
      </Flex>
    </Flex>
  )
}

function Stat({
  testID,
  value,
  title,
  description,
  valueTooltip,
  numberType = NumberType.FiatTokenStats,
}: {
  testID: string
  value: NumericStat
  title: ReactNode
  description?: ReactNode
  valueTooltip?: ReactNode
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
      <Flex
        tag="td"
        mt="$spacing8"
        alignItems="flex-start"
        data-testid={`${testID}-value`}
        $platform-web={{ overflowWrap: 'break-word' }}
      >
        <MouseoverTooltip
          disabled={!valueTooltip}
          text={valueTooltip}
          size={TooltipSize.Small}
          fitContent
          placement="top"
        >
          <AnimatedNumber numericValue={value ?? undefined} textVariant="$heading3" value={formattedValue} />
        </MouseoverTooltip>
      </Flex>
    </StatWrapper>
  )
}

export function StatsSection() {
  const { t } = useTranslation()
  const effectiveCurrency = useTDPEffectiveCurrency()

  const { isMultichainAggregateView } = useTDPMultichainAggregate()

  const currencyIdValue = useMemo(() => currencyId(effectiveCurrency), [effectiveCurrency])
  // Same call shape as the chart header's currentPriceOverride so both surfaces always agree.
  const currentPriceOverride = useTokenSpotPrice(currencyIdValue, {
    isMultichainAggregateView,
  })

  const stats = useTokenMarketStats(currencyIdValue, {
    currentPriceOverride,
    isMultichainAggregateView,
  })

  const { volume, tvl, poolsTvl, high52w, low52w, marketCap, fdv } = stats
  const hasStats = tvl || fdv || marketCap || volume || high52w || low52w
  const tvlBreakdown = getTokenTvlBreakdown({ tvl, poolsTvl })
  const symbol = effectiveCurrency.symbol ?? t('common.token')

  if (stats.isLoading) {
    return <LoadingStats />
  }

  if (hasStats) {
    return (
      <StatsWrapper data-testid={TestID.TokenDetailsStats}>
        <Text variant="heading3">{t('common.stats')}</Text>
        <TokenStatsSection>
          <Stat
            testID={TestID.TokenDetailsStatsTvl}
            value={tvl}
            description={t('stats.tvl.description', { symbol })}
            valueTooltip={tvlBreakdown && <TvlBreakdownTooltipContent breakdown={tvlBreakdown} symbol={symbol} />}
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
            description={t('token.stats.volume.1d.description')}
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
  return (
    <Text color="$neutral3" data-cy="token-details-no-stats-data">
      {t('stats.noStatsAvailable')}
    </Text>
  )
}
