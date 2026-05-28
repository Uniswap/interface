import { GraphQLApi } from '@universe/api'
import { curveCardinal, scaleLinear } from 'd3'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Skeleton, Text, useSporeColors } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import type { PoolData } from '~/appGraphql/data/pools/usePoolData'
import { calculateApr } from '~/appGraphql/data/pools/useTopPools'
import { gqlToCurrency, toHistoryDuration, TimePeriod } from '~/appGraphql/data/util'
import { getPriceBounds } from '~/components/Charts/PriceChart/utils'
import { LineChart } from '~/components/Charts/SparklineChart/LineChart'
import { DeltaArrow } from '~/components/DeltaArrow/DeltaArrow'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { usePoolPriceChartData } from '~/features/Liquidity/charts/usePoolPriceChartData'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { LpIncentivesAprDisplay } from '~/features/Liquidity/LPIncentives/LpIncentivesAprDisplay'
import { SIDEBAR_WIDTH } from '~/features/Liquidity/PoolProgressIndicator/PoolProgressIndicator'

const DOT_RADIUS = 4
const SPARKLINE_PADDING = DOT_RADIUS + 1
const SPARKLINE_WIDTH = SIDEBAR_WIDTH - 32 - 2
const SPARKLINE_HEIGHT = 64

export function PoolInfoSparkline({ poolData, width: overrideWidth }: { poolData: PoolData; width?: number }) {
  const colors = useSporeColors()

  const isV2 = poolData.protocolVersion === GraphQLApi.ProtocolVersion.V2
  const isV3 = poolData.protocolVersion === GraphQLApi.ProtocolVersion.V3
  const isV4 = poolData.protocolVersion === GraphQLApi.ProtocolVersion.V4

  const variables = useMemo(
    () => ({
      addressOrId: poolData.idOrAddress,
      chain: poolData.token0.chain,
      duration: toHistoryDuration(TimePeriod.DAY),
      isV2,
      isV3,
      isV4,
    }),
    [poolData.idOrAddress, poolData.token0.chain, isV2, isV3, isV4],
  )

  const { entries, loading } = usePoolPriceChartData({ variables, priceInverted: false })

  if (loading || entries.length <= 1) {
    return <Flex height={SPARKLINE_HEIGHT} />
  }

  const { min, max } = getPriceBounds(entries.map((e) => ({ timestamp: e.time, value: e.value })))
  const padding = (max - min) * 0.1 || 1
  const sparklineWidth = overrideWidth ?? SPARKLINE_WIDTH
  const xScale = scaleLinear()
    .domain([entries[0].time, entries[entries.length - 1].time])
    .range([SPARKLINE_PADDING, sparklineWidth - SPARKLINE_PADDING])
  const yScale = scaleLinear()
    .domain([min - padding, max + padding])
    .range([SPARKLINE_HEIGHT - SPARKLINE_PADDING, SPARKLINE_PADDING])

  const lastEntry = entries[entries.length - 1]
  const dotX = xScale(lastEntry.time)
  const dotY = yScale(lastEntry.value)

  return (
    <LineChart
      data={entries}
      getX={(p) => xScale(p.time)}
      getY={(p) => yScale(p.value)}
      curve={curveCardinal.tension(0.9)}
      color={colors.accent1.val}
      strokeWidth={1.5}
      width={sparklineWidth}
      height={SPARKLINE_HEIGHT}
    >
      <circle cx={dotX} cy={dotY} r={4} fill={colors.accent1.val} />
    </LineChart>
  )
}

export function StatCell({ label, value, delta }: { label: string; value: string; delta?: number }) {
  const { formatPercent } = useLocalizationContext()

  return (
    <Flex gap="$spacing4" flex={1}>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Flex row alignItems="center" gap="$spacing4">
        <Text variant="subheading2" color="$neutral1">
          {value}
        </Text>
        {delta !== undefined && delta !== 0 && (
          <Flex row alignItems="center" gap="$spacing2">
            <DeltaArrow delta={delta} formattedDelta={formatPercent(Math.abs(delta))} size={12} />
            <Text variant="body4" color={delta < 0 ? '$statusCritical' : '$statusSuccess'}>
              {formatPercent(Math.abs(delta))}
            </Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}

function StatCellSkeleton({ label }: { label: string }) {
  return (
    <Flex gap="$spacing4" flex={1}>
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      <Skeleton>
        <Flex height={20} width={80} borderRadius="$rounded8" backgroundColor="$surface3" />
      </Skeleton>
    </Flex>
  )
}

function PoolInfoCardLoading() {
  const { t } = useTranslation()

  return (
    <Flex
      width={SIDEBAR_WIDTH}
      alignSelf="flex-start"
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}
      borderRadius="$rounded24"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$padding16"
      gap="$spacing16"
    >
      <Flex row gap="$spacing18" alignItems="center">
        <Skeleton>
          <Flex width={48} height={48} borderRadius="$roundedFull" backgroundColor="$surface3" />
        </Skeleton>
        <Flex gap="$spacing4">
          <Skeleton>
            <Flex height={20} width={120} borderRadius="$rounded8" backgroundColor="$surface3" />
          </Skeleton>
          <Skeleton>
            <Flex height={16} width={80} borderRadius="$rounded8" backgroundColor="$surface3" />
          </Skeleton>
        </Flex>
      </Flex>

      <Flex gap="$spacing4">
        <Text variant="body3" color="$neutral2">
          {t('common.currentPrice')}
        </Text>
        <Skeleton>
          <Flex height={24} width={180} borderRadius="$rounded8" backgroundColor="$surface3" />
        </Skeleton>
      </Flex>

      <Flex height={SPARKLINE_HEIGHT} />

      <Flex borderTopWidth="$spacing1" borderTopColor="$surface3" pt="$spacing16" gap="$spacing16">
        <Flex row gap="$spacing16">
          <StatCellSkeleton label={t('common.totalValueLocked')} />
          <StatCellSkeleton label={t('stats.24volume')} />
        </Flex>
        <Flex row gap="$spacing16">
          <StatCellSkeleton label={t('stats.24fees')} />
          <StatCellSkeleton label={t('pool.apr.1day')} />
        </Flex>
      </Flex>
    </Flex>
  )
}

export function PoolStatsContent({ poolData, sparklineWidth }: { poolData: PoolData; sparklineWidth?: number }) {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()

  const currentPrice =
    poolData.token1Price && poolData.token0Price ? poolData.token1Price / poolData.token0Price : undefined

  const fees24h =
    poolData.volumeUSD24H !== undefined && poolData.feeTier
      ? poolData.volumeUSD24H * (poolData.feeTier.feeAmount / (BIPS_BASE * 100))
      : undefined

  const poolApr = useMemo(
    () =>
      calculateApr({
        volume24h: poolData.volumeUSD24H,
        tvl: poolData.tvlUSD,
        feeTier: poolData.feeTier?.feeAmount,
      }),
    [poolData.volumeUSD24H, poolData.tvlUSD, poolData.feeTier],
  )

  return (
    <>
      <Flex gap="$spacing4">
        <Text variant="body3" color="$neutral2">
          {t('common.currentPrice')}
        </Text>
        <Text variant="subheading1" color="$neutral1">
          {currentPrice
            ? `${formatNumberOrString({ value: currentPrice, type: NumberType.TokenNonTx })} ${poolData.token0.symbol} / ${poolData.token1.symbol}`
            : '-'}
        </Text>
      </Flex>

      <PoolInfoSparkline poolData={poolData} width={sparklineWidth} />

      <Flex borderTopWidth="$spacing1" borderTopColor="$surface3" pt="$spacing16" gap="$spacing16">
        <Flex row gap="$spacing16">
          <StatCell
            label={t('common.totalValueLocked')}
            value={formatNumberOrString({ value: poolData.tvlUSD, type: NumberType.FiatTokenStats })}
            delta={poolData.tvlUSDChange}
          />
          <StatCell
            label={t('stats.24volume')}
            value={formatNumberOrString({ value: poolData.volumeUSD24H, type: NumberType.FiatTokenStats })}
            delta={poolData.volumeUSD24HChange}
          />
        </Flex>
        <Flex row gap="$spacing16">
          <StatCell
            label={t('stats.24fees')}
            value={formatNumberOrString({ value: fees24h, type: NumberType.FiatTokenStats })}
          />
          <StatCell label={t('pool.apr.1day')} value={`${poolApr.toFixed(2)}%`} />
        </Flex>
      </Flex>

      {poolData.rewardsCampaign && poolData.rewardsCampaign.boostedApr > 0 && (
        <Flex borderTopWidth="$spacing1" borderTopColor="$surface3" pt="$spacing16" gap="$spacing4">
          <Text variant="body3" color="$neutral2">
            {t('pool.apr.reward')}
          </Text>
          <LpIncentivesAprDisplay lpIncentiveRewardApr={poolData.rewardsCampaign.boostedApr} />
        </Flex>
      )}
    </>
  )
}

export function PoolInfoCard({ poolData, loading }: { poolData?: PoolData; loading?: boolean }) {
  const currency0 = useMemo(() => (poolData ? gqlToCurrency(poolData.token0) : undefined), [poolData])
  const currency1 = useMemo(() => (poolData ? gqlToCurrency(poolData.token1) : undefined), [poolData])

  if (!poolData) {
    if (loading) {
      return <PoolInfoCardLoading />
    }
    return null
  }

  return (
    <Flex
      width={SIDEBAR_WIDTH}
      alignSelf="flex-start"
      $platform-web={{ position: 'sticky', top: INTERFACE_NAV_HEIGHT + 25 }}
      borderRadius="$rounded24"
      borderColor="$surface3"
      borderWidth="$spacing1"
      p="$padding16"
      gap="$spacing16"
    >
      <Flex row gap="$spacing18" alignItems="center">
        <DoubleCurrencyLogo currencies={[currency0, currency1]} size={48} />
        <Flex gap="$spacing4">
          <Text variant="subheading1" color="$neutral1">
            {poolData.token0.symbol} / {poolData.token1.symbol}
          </Text>
          <Flex row flexWrap="wrap">
            <LiquidityPositionInfoBadges
              version={poolData.protocolVersion}
              v4hook={poolData.hookAddress}
              feeTier={poolData.feeTier}
              size="default"
            />
          </Flex>
        </Flex>
      </Flex>

      <PoolStatsContent poolData={poolData} />
    </Flex>
  )
}
