import { AnimatableCopyIcon, Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangle } from '@universe/mycelium/icons/AlertTriangle'
import { ArrowsExpand } from '@universe/mycelium/icons/ArrowsExpand'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import type { ReactNode } from 'react'
import { Fragment, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ChartUnavailableOverlay } from '~/components/Charts/ChartUnavailableOverlay'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { MAX_PLOTTABLE_VALUE, PriceChartBody, type PriceChartData } from '~/components/Charts/PriceChart'
import { ChartType, PriceChartType } from '~/components/Charts/utils'

export const HOVER_CARD_CHART_HEIGHT = 104
export const HOVER_CARD_CONTENT_WIDTH = 240

export function getHoverCardContentWidth(maxWidth?: number): number {
  return maxWidth !== undefined
    ? Math.min(HOVER_CARD_CONTENT_WIDTH, Math.max(0, Math.floor(maxWidth)))
    : HOVER_CARD_CONTENT_WIDTH
}

export function HoverCardHeaderActions({
  isCopied = false,
  onCopy,
  onExpand,
}: {
  isCopied?: boolean
  onCopy?: () => void
  onExpand?: () => void
}): JSX.Element {
  return (
    <Flex row gap="$spacing8" alignItems="center">
      {onCopy && (
        <TouchableArea hoverStyle={{ opacity: 0.7 }} onPress={onCopy}>
          <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral2" />
        </TouchableArea>
      )}
      {onExpand && (
        <TouchableArea hoverStyle={{ opacity: 0.7 }} onPress={onExpand}>
          <ArrowsExpand color="$neutral2" size={iconSizes.icon12} />
        </TouchableArea>
      )}
    </Flex>
  )
}

export function HoverCardNoDataState(): JSX.Element {
  const { t } = useTranslation()
  return (
    <Flex
      alignItems="center"
      gap="$spacing8"
      p="$spacing16"
      borderRadius="$rounded12"
      backgroundColor="$surface2"
      width="100%"
    >
      <AlertTriangle size="$icon.24" color="$neutral3" />
      <Text variant="body2" color="$neutral3" textAlign="center">
        {t('token.data.unavailable')}
      </Text>
    </Flex>
  )
}

export function isHoverCardNoData({
  loading,
  headline,
  change,
  data,
}: {
  loading: boolean
  headline?: number | null
  change?: number | null
  data?: PriceChartData[]
}): boolean {
  return !loading && headline == null && change == null && !hasHoverCardChartData(data)
}

interface HoverCardBodyProps {
  identity?: ReactNode
  isCopied?: boolean
  onCopy?: () => void
  onExpand?: () => void
  isNoData?: boolean
  maxWidth?: number
  children: ReactNode
}

export function HoverCardBody({
  identity,
  isCopied,
  onCopy,
  onExpand,
  isNoData = false,
  maxWidth,
  children,
}: HoverCardBodyProps): JSX.Element {
  return (
    <Flex gap="$spacing8" width={getHoverCardContentWidth(maxWidth)}>
      {identity !== undefined && (
        <Flex row justifyContent="space-between" alignItems="center" gap="$spacing8">
          <Flex row gap="$spacing8" alignItems="center" flex={1} minWidth={0}>
            {identity}
          </Flex>
          <HoverCardHeaderActions isCopied={isCopied} onCopy={onCopy} onExpand={onExpand} />
        </Flex>
      )}
      {isNoData ? <HoverCardNoDataState /> : children}
    </Flex>
  )
}

/**
 * Dot-separated body3 stats under the chart (e.g. "$1.2M 24H vol · $3.4M TVL"). Absent entries are
 * dropped rather than rendered empty, so callers pass whatever they have and the row hides itself
 * when nothing is known.
 */
export function HoverCardStatsRow({
  loading,
  loadingPlaceholderText,
  stats,
}: {
  loading: boolean
  loadingPlaceholderText: string
  stats: (string | undefined)[]
}): JSX.Element | null {
  if (loading) {
    return <Text variant="body3" color="$neutral2" loading loadingPlaceholderText={loadingPlaceholderText} />
  }

  const presentStats = stats.filter((stat): stat is string => !!stat)
  if (presentStats.length === 0) {
    return null
  }

  return (
    <Flex row alignItems="center" gap="$spacing12">
      {presentStats.map((stat, index) => (
        // Positional: the row is a short fixed list, and two stats can legitimately format to the same string.
        <Fragment key={index}>
          {index > 0 && <Flex width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />}
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {stat}
          </Text>
        </Fragment>
      ))}
    </Flex>
  )
}

export function HoverCardChartSkeleton(): JSX.Element {
  return (
    <ChartSkeleton type={ChartType.PRICE} height={HOVER_CARD_CHART_HEIGHT} hideYAxis hideXAxis hidePriceIndicators />
  )
}

function useHoverCardLineColor({ change, data }: { change?: number | null; data?: PriceChartData[] }): string {
  const colors = useSporeColors()
  const isPositive = useMemo(() => {
    if (change != null) {
      return change >= 0
    }
    if (data && data.length >= 2) {
      return data[data.length - 1].value >= data[0].value
    }
    return true
  }, [change, data])
  return isPositive ? colors.statusSuccess.val : colors.statusCritical.val
}

/** Any finite series can be drawn; an oversized one is scaled to fit by `fitHoverCardChartData`. */
export function hasHoverCardChartData(data: PriceChartData[] | undefined): data is PriceChartData[] {
  return data != null && data.length > 1 && data.every((entry) => Number.isFinite(entry.value))
}

/**
 * Divides a series the chart cannot plot by a power of ten large enough to fit. Prices here derive from
 * creator-supplied token metadata, so the series is fitted rather than trusted. The sparkline shows no
 * axis, crosshair, or price lines, so only the shape reaches the screen and one shared divisor keeps it.
 */
export function fitHoverCardChartData(data: PriceChartData[]): PriceChartData[] {
  const largestMagnitude = data.reduce((largest, entry) => Math.max(largest, Math.abs(entry.value)), 0)
  if (largestMagnitude <= MAX_PLOTTABLE_VALUE) {
    return data
  }
  // floor + 1 rather than ceil so a ratio that is an exact power of ten still lands strictly inside the limit
  const divisor = 10 ** (Math.floor(Math.log10(largestMagnitude / MAX_PLOTTABLE_VALUE)) + 1)
  return data.map((entry) => ({
    ...entry,
    value: entry.value / divisor,
    open: entry.open / divisor,
    high: entry.high / divisor,
    low: entry.low / divisor,
    close: entry.close / divisor,
  }))
}

export function HoverCardChart({
  loading,
  data,
  change,
}: {
  loading: boolean
  data?: PriceChartData[]
  change?: number | null
}): JSX.Element {
  const lineColor = useHoverCardLineColor({ change, data })
  const chartData = useMemo(() => (hasHoverCardChartData(data) ? fitHoverCardChartData(data) : undefined), [data])

  if (loading) {
    return <HoverCardChartSkeleton />
  }

  if (chartData) {
    return (
      <PriceChartBody
        data={chartData}
        height={HOVER_CARD_CHART_HEIGHT}
        type={PriceChartType.LINE}
        stale={false}
        hideYAxis
        sparkline
        hideMinMaxLines
        overrideColor={lineColor}
      />
    )
  }

  return <ChartUnavailableOverlay height={HOVER_CARD_CHART_HEIGHT} />
}
