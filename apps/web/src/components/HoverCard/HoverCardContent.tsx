import { AnimatableCopyIcon, Flex, iconSizes, Text, TouchableArea } from '@universe/mycelium'
import { AlertTriangle } from '@universe/mycelium/icons/AlertTriangle'
import { AlertTriangleFilled } from '@universe/mycelium/icons/AlertTriangleFilled'
import { ArrowsExpand } from '@universe/mycelium/icons/ArrowsExpand'
import { BlockExplorer } from '@universe/mycelium/icons/BlockExplorer'
import { useSporeColors } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
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

const HEADER_ACTION_SIZE = 28

function HoverCardHeaderAction({
  testID,
  onPress,
  children,
}: {
  testID?: string
  onPress: () => void
  children: ReactNode
}): JSX.Element {
  return (
    <TouchableArea
      testID={testID}
      width={HEADER_ACTION_SIZE}
      height={HEADER_ACTION_SIZE}
      alignItems="center"
      justifyContent="center"
      borderRadius="$rounded6"
      hoverStyle={{ opacity: 0.7 }}
      onPress={onPress}
    >
      {children}
    </TouchableArea>
  )
}

export function HoverCardHeaderActions({
  isCopied = false,
  onCopy,
  onExpand,
  onOpenExplorer,
  explorerTestID,
}: {
  isCopied?: boolean
  onCopy?: () => void
  onExpand?: () => void
  onOpenExplorer?: () => void
  explorerTestID?: string
}): JSX.Element {
  return (
    <Flex row alignItems="center">
      {onCopy && (
        <HoverCardHeaderAction onPress={onCopy}>
          <AnimatableCopyIcon isCopied={isCopied} size={iconSizes.icon16} textColor="$neutral2" />
        </HoverCardHeaderAction>
      )}
      {onOpenExplorer && (
        <HoverCardHeaderAction testID={explorerTestID} onPress={onOpenExplorer}>
          <BlockExplorer color="$neutral2" size="$icon.16" />
        </HoverCardHeaderAction>
      )}
      {onExpand && (
        <HoverCardHeaderAction onPress={onExpand}>
          <ArrowsExpand color="$neutral2" size="$icon.16" />
        </HoverCardHeaderAction>
      )}
    </Flex>
  )
}

export function HoverCardIdentity({
  logo,
  title,
  subtitle,
  loading = false,
}: {
  logo: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  loading?: boolean
}): JSX.Element {
  return (
    <>
      {logo}
      <Flex shrink minWidth={0}>
        <Text variant="body3" color="$neutral1" numberOfLines={1} loading={loading} loadingPlaceholderText="TOKEN">
          {title}
        </Text>
        {(loading || subtitle !== undefined) && (
          <Text
            variant="body3"
            color="$neutral2"
            numberOfLines={1}
            loading={loading}
            loadingPlaceholderText="0x0000...0000"
          >
            {subtitle}
          </Text>
        )}
      </Flex>
    </>
  )
}

export function HoverCardHeadline({
  loading,
  loadingPlaceholderText,
  value,
  lowPricingConfidence = false,
  caption,
}: {
  loading: boolean
  loadingPlaceholderText: string
  value: string
  lowPricingConfidence?: boolean
  caption?: ReactNode
}): JSX.Element {
  const showLowConfidenceWarning = !loading && lowPricingConfidence
  return (
    // A prefix icon can push the caption past the card's width, so let it drop to its own line.
    <Flex
      row
      alignItems="baseline"
      gap="$spacing8"
      pt="$spacing4"
      flexWrap="wrap"
      rowGap={lowPricingConfidence ? '$spacing2' : undefined}
    >
      <Flex row alignItems="center" gap="$spacing4">
        {/* No tooltip here: one nested in the hover card popover renders behind the card. */}
        {showLowConfidenceWarning && (
          <AlertTriangleFilled testID={TestID.LowPriceConfidenceIcon} color="$neutral3" size="$icon.20" />
        )}
        <Text variant="heading3" color="$neutral1" loading={loading} loadingPlaceholderText={loadingPlaceholderText}>
          {value}
        </Text>
      </Flex>
      {!loading && caption}
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
  onOpenExplorer?: () => void
  explorerTestID?: string
  isNoData?: boolean
  maxWidth?: number
  children: ReactNode
}

export function HoverCardBody({
  identity,
  isCopied,
  onCopy,
  onExpand,
  onOpenExplorer,
  explorerTestID,
  isNoData = false,
  maxWidth,
  children,
}: HoverCardBodyProps): JSX.Element {
  return (
    <Flex gap="$spacing8" width={getHoverCardContentWidth(maxWidth)}>
      {identity !== undefined && (
        <Flex row justifyContent="space-between" alignItems="flex-start" gap="$spacing8">
          <Flex row gap="$spacing8" alignItems="center" flex={1} minWidth={0}>
            {identity}
          </Flex>
          <HoverCardHeaderActions
            isCopied={isCopied}
            onCopy={onCopy}
            onExpand={onExpand}
            onOpenExplorer={onOpenExplorer}
            explorerTestID={explorerTestID}
          />
        </Flex>
      )}
      {isNoData ? <HoverCardNoDataState /> : children}
    </Flex>
  )
}

export function HoverCardDotSeparator(): JSX.Element {
  return <Flex width={4} height={4} borderRadius="$roundedFull" backgroundColor="$neutral3" />
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
          {index > 0 && <HoverCardDotSeparator />}
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
