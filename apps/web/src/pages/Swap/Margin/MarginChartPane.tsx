import { Flex, Text, useSporeColors } from '@universe/mycelium'
/* oxlint-disable max-lines */
import { ENTER_PRESET_CLASSES, EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { Presence } from '@universe/mycelium/presence'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { TestID } from '@universe/test'
import { useParentSize } from '@visx/responsive'
import { lighten } from 'polished'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Tooltip } from 'ui/src'
import { CandlestickChart } from 'ui/src/components/icons/CandlestickChart'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { LineChartDots } from 'ui/src/components/icons/LineChartDots'
import { SplitLogo } from 'uniswap/src/components/CurrencyLogo/SplitLogo'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useMarginFormStore } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPairKey, MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import { Chart } from '~/components/Charts/ChartModel'
import { ChartErrorView } from '~/components/Charts/LoadingState'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { DataQuality, PriceChartType } from '~/components/Charts/utils'
import { MouseoverTooltip } from '~/components/Tooltip'
import { MARGIN_CHAIN_ID, type MarginMarket } from '~/constants/margin'
import { extrapolateAccrued } from '~/pages/Swap/Margin/chart/marginChartMath'
import { type MarginChartPrefs, useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import { MarginChartSettings } from '~/pages/Swap/Margin/chart/MarginChartSettings'
import { MarginChartTooltip, type MarginTooltipData } from '~/pages/Swap/Margin/chart/MarginChartTooltip'
import { MarginChartZoomButtons } from '~/pages/Swap/Margin/chart/MarginChartZoomButtons'
import {
  useMarginChartData,
  volatileLeg,
  type MarginChartData,
  type MarginChartTimeframe,
} from '~/pages/Swap/Margin/chart/useMarginChartData'
import { useMarginChartOverlays, type MarginChartOverlays } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import { useMarginVolume } from '~/pages/Swap/Margin/chart/useMarginVolume'
import { MAX_VERTICAL_ZOOM_STEP } from '~/pages/Swap/Margin/chart/verticalZoom'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/pages/Swap/Margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { useMarginVenueAllowlist } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'
import {
  accruedUsd,
  bpsToPercent,
  formatMarginDebtUnits,
  formatMaxLeverage,
  formatSignedFiat,
  lltvToPercent,
  marginVenueLabel,
  scaledE18ToNumber,
} from '~/pages/Swap/Margin/marginFormat'
import { useMarginMorph } from '~/pages/Swap/Margin/MarginMorphContext'
import { getMarginLeverageCap } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { MarginPriceChartModel } from '~/pages/Swap/Margin/MarginPriceChartModel'
import {
  marginMarketDirection,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapSymbol,
} from '~/pages/Swap/Margin/marginTokenDisplay'

const TIMEFRAMES: MarginChartTimeframe[] = ['1H', '1D', '1W', '1M', '1Y', 'ALL']
const TF_OPTIONS = TIMEFRAMES.map((tf) => ({ value: tf, displayText: tf === 'ALL' ? 'All' : tf }))
// One fixed height shared by the container, the skeleton and the real chart so the swap→chart
// handoff has zero dimensional jump.
const MARGIN_CHART_HEIGHT = 480

export function MarginChartPane(): JSX.Element {
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { getPairMarket, markets, isLoading, isFetching, error, refetch } = useMarginMarkets()
  // A populated registry with a momentarily-stale stored key still shows the first available
  // market instead of the unavailable state — matches PairHeaderButton/MarginStatsStrip's own
  // resolution, so all three surfaces agree on "unavailable" only when the registry is truly empty.
  const market = getPairMarket(pairKey) ?? markets.at(0)

  if (!market) {
    return (
      <Flex fill gap="$spacing8">
        <MarginStatsStrip pairKey={pairKey} stats24h={{}} />
        <Flex height={MARGIN_CHART_HEIGHT} alignItems="center" justifyContent="center">
          <MarginFormMarketsState isLoading={isLoading || isFetching} error={error} onRetry={refetch} />
        </Flex>
      </Flex>
    )
  }

  return <MarginChartPaneBody market={market} pairKey={pairKey} />
}

// Mounts only once the pane's gate resolves a market: the chart data, volume and overlay hooks all
// require one.
function MarginChartPaneBody({
  market,
  pairKey,
}: {
  market: MarginMarket
  pairKey: MarginPairKey | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const [timeframe, setTimeframe] = useState<MarginChartTimeframe>('1D')
  // Chart-settings popover open state, lifted so the chart suppresses its crosshair/tooltip while the
  // panel is open (spec F16) — on short viewports the panel overlays the chart.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { parentRef, width } = useParentSize({ debounceTime: 50 })
  // Mount lightweight-charts only after the layout morph settles (avoids resize thrash); the
  // candlestick skeleton bridges the whole expand until then.
  const { morphSettled } = useMarginMorph()

  const { candles, quality, loading, error, refetch, stats24h, candlesUnavailable } = useMarginChartData({
    market,
    timeframe,
  })

  // Chart style (spec F14): the persisted pref drives the toggle, but line-only fallback markets have
  // no real OHLC, so the effective type is forced to line there regardless of the pref.
  const chartStyle = useMarginChartPrefs((s) => s.chartStyle)
  const setChartPrefs = useMarginChartPrefs((s) => s.setChartPrefs)
  // Optional volume histogram (spec F15), default OFF. The data hook stays prefs-agnostic — the pane
  // gates it via `enabled` so the query is skipped while the overlay is off.
  const volumeEnabled = useMarginChartPrefs((s) => s.volume)
  const { volumeBars } = useMarginVolume({ market, timeframe, enabled: volumeEnabled })
  const effectiveStyle: MarginChartPrefs['chartStyle'] = candlesUnavailable ? 'line' : chartStyle
  const effectiveChartType = effectiveStyle === 'line' ? PriceChartType.LINE : PriceChartType.CANDLESTICK
  const onSelectStyle = useEvent((style: MarginChartPrefs['chartStyle']): void => {
    if (candlesUnavailable && style === 'candles') {
      return // candles disabled on line-only markets
    }
    setChartPrefs({ chartStyle: style })
  })

  // Visible price range, published by the model, fed back into the composer (label de-collision).
  // Value-compare before writing: the model re-publishes on every updateOptions, so a fresh-but-
  // equal object here would loop state → overlays → params → updateOptions → publish forever.
  const [visibleRange, setVisibleRange] = useState<{ min: number; max: number } | undefined>(undefined)
  const onVisibleRangeChange = useEvent((range?: { min: number; max: number }): void => {
    setVisibleRange((prev) => (prev?.min === range?.min && prev?.max === range?.max ? prev : range))
  })
  // Ascending candle times (the data hook sorts) fed to the composer for event-marker snapping.
  const candleTimes = useMemo(() => candles.map((c) => c.time), [candles])
  const overlays = useMarginChartOverlays({
    market,
    candleTimes,
    visiblePriceRange: visibleRange,
    paneHeightPx: MARGIN_CHART_HEIGHT,
  })

  // Vertical zoom (0 = fit candles ∪ overlays, MAX = fit candles). Reset per market so a fresh
  // pair always opens on the default view with its liquidation line on-screen.
  const [verticalZoomStep, setVerticalZoomStep] = useState(0)
  useEffect(() => setVerticalZoomStep(0), [pairKey])
  const onZoomIn = useEvent((): void => setVerticalZoomStep((s) => Math.min(s + 1, MAX_VERTICAL_ZOOM_STEP)))
  const onZoomOut = useEvent((): void => setVerticalZoomStep((s) => Math.max(s - 1, 0)))
  const onZoomReset = useEvent((): void => setVerticalZoomStep(0))

  const params = useMemo(
    () => ({
      data: candles,
      type: effectiveChartType,
      stale: quality === DataQuality.STALE,
      hideMinMaxLines: true,
      overlays,
      onVisibleRangeChange,
      volumeBars,
      suppressCrosshair: isSettingsOpen,
      verticalZoomStep,
    }),
    [
      candles,
      effectiveChartType,
      quality,
      overlays,
      onVisibleRangeChange,
      volumeBars,
      isSettingsOpen,
      verticalZoomStep,
    ],
  )

  // Chart's TooltipBody receives only `data`, so bind the margin extras (econ, leverage, privacy)
  // here. The crosshair item is the model's augmented payload — cast to the margin data type
  // (Chart's TDataType is pinned to PriceChartData by the Model generic, so the extension can't
  // flow through the prop types).
  const direction =
    market.direction ??
    marginMarketDirection({ collateralToken: market.collateral.address, debtToken: market.debt.address })
  const collateralSymbol = market.displaySymbol
  const { econ, usdBasis, primaryLeverage, hasPosition, figuresStale } = overlays
  const TooltipBody = useMemo(() => {
    return function MarginPaneTooltip({ data }: { data: PriceChartData }): JSX.Element {
      return (
        <MarginChartTooltip
          data={data as MarginTooltipData}
          econ={econ}
          usdBasis={usdBasis}
          direction={direction}
          leverage={primaryLeverage}
          collateralSymbol={collateralSymbol}
        />
      )
    }
  }, [econ, usdBasis, primaryLeverage, direction, collateralSymbol])

  const showChart = morphSettled && candles.length > 0 && width > 0
  // Terminal states, gated before the chart mounts. Error only when there's nothing to fall back
  // to — an error alongside existing candles keeps the (stale) chart. Empty gates on !loading so
  // the skeleton bridges both the initial fetch and the line-only fallback's own loading window,
  // never flashing empty copy in between.
  const showError = Boolean(error) && candles.length === 0
  const showEmpty = !loading && (candles.length === 0 || quality === DataQuality.INVALID)

  return (
    <Flex fill gap="$spacing8">
      <MarginStatsStrip pairKey={pairKey} routedVenue={overlays.routedVenue} stats24h={stats24h} />
      <Flex height={MARGIN_CHART_HEIGHT} ref={parentRef} position="relative">
        {showError ? (
          <ChartErrorView>
            <Flex row>
              <Button size="small" variant="branded" emphasis="secondary" onPress={refetch}>
                {t('common.button.retry')}
              </Button>
            </Flex>
          </ChartErrorView>
        ) : showEmpty ? (
          <Flex position="absolute" top={0} right={0} bottom={0} left={0} alignItems="center" justifyContent="center">
            <Text variant="body3" color="$neutral2">
              {t('margin.chart.empty')}
            </Text>
          </Flex>
        ) : (
          /* Skeleton ⇄ chart crossfade. Both absolutely fill the fixed-height box so they overlap
             during the fade handoff — the skeleton is painted underneath while the real chart fades in,
             then exits. It is never left under the transparent chart (would bleed shimmer). */
          <Presence>
            {showChart ? (
              // Own stacking context so lightweight-charts' internal canvases (z-index 1/2) can't
              // outrank the settings popover overlaying the chart — otherwise clicks fall through to
              // the canvas and the crosshair paints over the panel.
              <Flex
                key="chart"
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                left={0}
                style={{ isolation: 'isolate' }}
                className={ENTER_PRESET_CLASSES.fadeIn}
              >
                <Chart
                  Model={MarginPriceChartModel}
                  params={params}
                  height={MARGIN_CHART_HEIGHT}
                  TooltipBody={TooltipBody}
                />
              </Flex>
            ) : (
              <Flex
                key="skeleton"
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                left={0}
                className={EXIT_PRESET_CLASSES.fadeOut}
              >
                <MarginChartSkeleton height={MARGIN_CHART_HEIGHT} />
              </Flex>
            )}
          </Presence>
        )}
        {showChart && overlays.legend ? (
          <MarginChartLegendChip
            legend={overlays.legend}
            positionsDataUpdatedAt={overlays.positionsDataUpdatedAt}
            figuresStale={figuresStale ?? false}
          />
        ) : null}
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        <SegmentedControl<MarginChartTimeframe>
          size="small"
          outlined
          options={TF_OPTIONS}
          selectedOption={timeframe}
          onSelectOption={setTimeframe}
        />
        <Flex row alignItems="center" gap="$spacing8" marginLeft="auto">
          <MarginChartZoomButtons
            step={verticalZoomStep}
            zoomAvailable={overlays.autoscaleBounds !== undefined}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onReset={onZoomReset}
          />
          <MarginChartStyleToggle
            selectedStyle={effectiveStyle}
            candlesUnavailable={candlesUnavailable}
            onSelectStyle={onSelectStyle}
          />
          <MarginChartSettings
            hasPosition={hasPosition ?? false}
            // Volume-tooltip symbol: the histogram plots the volatile leg's volume (debt on shorts), unwrapped WETH→ETH for display.
            symbol={marginUnwrapSymbol(volatileLeg({ market }))}
            leverage={primaryLeverage}
            open={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}

const STYLE_TOGGLE_ICON_SIZE = '$icon.16'

// Inline line↔candle toggle (spec F14), mirroring AdvancedPriceChartToggle's iconography. On line-only
// fallback markets the candle option is disabled and explains itself via tooltip; the pane also forces
// the effective type to line there, so selecting candles is guarded upstream as well.
function MarginChartStyleToggle({
  selectedStyle,
  candlesUnavailable,
  onSelectStyle,
}: {
  selectedStyle: MarginChartPrefs['chartStyle']
  candlesUnavailable: boolean
  onSelectStyle: (style: MarginChartPrefs['chartStyle']) => void
}): JSX.Element {
  const { t } = useTranslation()
  const options = [
    {
      value: 'line' as const,
      display: (
        <Flex row centered testID={TestID.MarginChartStyleLine}>
          <LineChartDots color="$neutral1" size={STYLE_TOGGLE_ICON_SIZE} />
        </Flex>
      ),
    },
    {
      value: 'candles' as const,
      disabled: candlesUnavailable,
      display: (
        <Flex
          row
          centered
          opacity={candlesUnavailable ? 0.2 : 1}
          style={candlesUnavailable ? { cursor: 'not-allowed' } : undefined}
          testID={TestID.MarginChartStyleCandles}
        >
          <CandlestickChart color="$neutral1" size={STYLE_TOGGLE_ICON_SIZE} />
        </Flex>
      ),
      wrapper: candlesUnavailable ? (
        <MouseoverTooltip text={t('margin.chart.style.candlesUnavailable')} placement="top" />
      ) : undefined,
    },
  ]
  return (
    <SegmentedControl<MarginChartPrefs['chartStyle']>
      size="small"
      outlined
      options={options}
      selectedOption={selectedStyle}
      onSelectOption={onSelectStyle}
    />
  )
}

const CHIP_TICK_MS = 1000

// Top-left overlay chip: `{pair} {leverage} · PnL ±$X (±Y%) · Interest $Z · {venue}`. The interest
// figure ticks live between positions polls by re-extrapolating from the fetch anchor (never
// accumulating), so a backgrounded tab shows the correct value the moment it foregrounds.
function MarginChartLegendChip({
  legend,
  positionsDataUpdatedAt,
  figuresStale,
}: {
  legend: NonNullable<MarginChartOverlays['legend']>
  positionsDataUpdatedAt: number | undefined
  // The chip's figures come off the positions poll, so its cue does too.
  figuresStale: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  const ticker = legend.ticker
  const canTick = ticker !== undefined && positionsDataUpdatedAt !== undefined

  const computeAccruedUsd = useEvent((): number | undefined => {
    if (!ticker || positionsDataUpdatedAt === undefined) {
      return legend.accruedUsd
    }
    const dtSeconds = (Date.now() - positionsDataUpdatedAt) / 1000
    const accrued = extrapolateAccrued({
      accruedWire: ticker.normalizedAccrued,
      debt: ticker.normalizedDebt,
      apyBps: ticker.apyBps,
      dtSeconds,
    })
    return accruedUsd({ accrued, direction: ticker.direction, mark: ticker.mark })
  })

  const [liveAccruedUsd, setLiveAccruedUsd] = useState<number | undefined>(legend.accruedUsd)

  useEffect(() => {
    // Re-anchor on mount and whenever the fetch changes, then tick every second while data allows.
    setLiveAccruedUsd(computeAccruedUsd())
    if (!canTick) {
      return undefined
    }
    const id = setInterval(() => setLiveAccruedUsd(computeAccruedUsd()), CHIP_TICK_MS)
    return () => clearInterval(id)
  }, [canTick, positionsDataUpdatedAt, computeAccruedUsd])

  const segments: Array<{ key: string; text: string; tooltip?: string }> = [
    { key: 'identity', text: legend.leverage ? `${legend.pair} ${legend.leverage}` : legend.pair },
  ]

  const pnlText =
    legend.pnlUsd !== undefined && legend.pnlPct !== undefined
      ? t('margin.chart.legend.pnl', {
          value: formatSignedFiat({
            value: legend.pnlUsd,
            format: (n) => convertFiatAmountFormatted(n, NumberType.FiatTokenPrice),
          }),
          // "≤" on the floor: past the liquidation price the loss is at least all of the margin.
          pct: `${legend.pnlFloored ? '≤' : ''}${legend.pnlPct >= 0 ? '+' : ''}${formatPercent(legend.pnlPct, 2)}`,
        })
      : undefined
  const pnlSegment = pnlText
  if (pnlSegment !== undefined) {
    segments.push({ key: 'pnl', text: pnlSegment, tooltip: t('margin.chart.explain.chipPnl') })
  }

  // FiatTokenPrice gives the accrued figure enough precision to tick visibly between polls. When not
  // ticking, read the live prop directly so a fresh legend.accruedUsd isn't trapped behind the seed.
  const displayedAccruedUsd = canTick ? liveAccruedUsd : legend.accruedUsd
  const interestText =
    displayedAccruedUsd !== undefined
      ? t('margin.chart.legend.interest', {
          value: convertFiatAmountFormatted(displayedAccruedUsd, NumberType.FiatTokenPrice),
        })
      : undefined
  const interestSegment = interestText
  if (interestSegment !== undefined) {
    // Tooltip only when the (unmasked) ticker exposes the APY the copy interpolates.
    const apy = legend.ticker ? bpsToPercent(legend.ticker.apyBps).toFixed(2) : undefined
    segments.push({
      key: 'interest',
      text: interestSegment,
      tooltip: apy !== undefined ? t('margin.chart.explain.chipInterest', { apy }) : undefined,
    })
  }

  segments.push({ key: 'venue', text: marginVenueLabel(legend.venue) })

  return (
    <Flex position="absolute" top="$spacing8" left="$spacing8" pointerEvents="none" zIndex="$default">
      {/* Box stays hover-transparent so the crosshair reads through; only tooltip triggers capture. */}
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        backgroundColor="$surface2"
        borderColor="$surface3"
        borderWidth={1}
        borderRadius="$rounded12"
        px="$spacing8"
        py="$spacing4"
        pointerEvents="none"
        testID={TestID.MarginChartLegendChip}
      >
        {figuresStale ? (
          <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
            <Tooltip.Trigger>
              <Flex
                width={6}
                height={6}
                borderRadius="$roundedFull"
                backgroundColor="$statusWarning"
                pointerEvents="auto"
                testID={TestID.MarginChartLegendStaleDot}
              />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              <Text variant="body4">{t('margin.chart.stale.tooltip')}</Text>
            </Tooltip.Content>
          </Tooltip>
        ) : null}
        {segments.map((seg, i) => (
          <Flex key={seg.key} row alignItems="center" gap="$spacing8">
            {i > 0 ? (
              <Text variant="body4" color="$neutral3">
                ·
              </Text>
            ) : null}
            {seg.tooltip ? (
              <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
                <Tooltip.Trigger>
                  <Text variant="body4" color="$neutral2" pointerEvents="auto">
                    {seg.text}
                  </Text>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <Tooltip.Arrow />
                  <Text variant="body4">{seg.tooltip}</Text>
                </Tooltip.Content>
              </Tooltip>
            ) : (
              <Text variant="body4" color="$neutral2">
                {seg.text}
              </Text>
            )}
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}

const SKELETON_CANDLE_COUNT = 32
const SKELETON_VIEWBOX_WIDTH = 726

interface SkeletonCandle {
  bodyX: number
  bodyY: number
  bodyWidth: number
  bodyHeight: number
  wickX: number
  wickY: number
  wickWidth: number
  wickHeight: number
}

// Deterministic candle geometry in viewBox units (0 = top). Combined sines give an organic-looking
// price walk; body/wick spans vary per candle so the shimmer reads as candlesticks, not bars.
function buildSkeletonCandles({ height }: { height: number }): SkeletonCandle[] {
  const slot = SKELETON_VIEWBOX_WIDTH / SKELETON_CANDLE_COUNT
  const bodyWidth = slot * 0.5
  const wickWidth = Math.max(1.5, slot * 0.08)
  const clamp = (n: number): number => Math.min(0.96, Math.max(0.04, n))
  return Array.from({ length: SKELETON_CANDLE_COUNT }, (_, i) => {
    const slotX = i * slot
    const center = 0.5 + 0.26 * Math.sin(i * 0.5) + 0.09 * Math.sin(i * 1.7 + 1) + 0.05 * Math.sin(i * 3.1)
    const halfBody = 0.02 + 0.05 * (0.5 + 0.5 * Math.sin(i * 2.3 + 0.5))
    const wickExt = 0.02 + 0.035 * (0.5 + 0.5 * Math.sin(i * 1.13 + 2))
    const bodyTopN = clamp(center - halfBody)
    const bodyBotN = clamp(center + halfBody)
    const wickTopN = clamp(bodyTopN - wickExt)
    const wickBotN = clamp(bodyBotN + wickExt)
    return {
      bodyX: slotX + (slot - bodyWidth) / 2,
      bodyY: bodyTopN * height,
      bodyWidth,
      bodyHeight: Math.max(2, (bodyBotN - bodyTopN) * height),
      wickX: slotX + (slot - wickWidth) / 2,
      wickY: wickTopN * height,
      wickWidth,
      wickHeight: Math.max(2, (wickBotN - wickTopN) * height),
    }
  })
}

// Loading bridge shaped like the real candlestick chart (not the generic line/sine ChartSkeleton) so
// the swap→chart handoff has no shape jump. Reuses LoadingState's shimmer gradient, masking a row of
// vertical candle rects + wicks. Width-independent (viewBox scaling), so ResizeObserver never touches it.
function MarginChartSkeleton({ height }: { height: number }): JSX.Element {
  const colors = useSporeColors()
  const candles = useMemo(() => buildSkeletonCandles({ height }), [height])
  const gradientId = 'margin-chart-skeleton-gradient'
  const maskId = 'margin-chart-skeleton-mask'
  return (
    <Flex row width="100%" alignItems="center" position="relative" testID={TestID.MarginChartSkeleton}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${SKELETON_VIEWBOX_WIDTH} ${height}`}
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0" stopColor={colors.neutral3.val}>
              <animate attributeName="offset" values="-1;3" dur="1.3s" repeatCount="indefinite" />
            </stop>
            <stop offset="0.5" stopColor={lighten(0.24, colors.neutral3.val)}>
              <animate attributeName="offset" values="-0.5;3.5" dur="1.3s" repeatCount="indefinite" />
            </stop>
            <stop offset="1" stopColor={colors.neutral3.val}>
              <animate attributeName="offset" values="0;4" dur="1.3s" repeatCount="indefinite" />
            </stop>
          </linearGradient>
        </defs>
        <mask id={maskId} style={{ maskType: 'alpha' }}>
          {candles.map((c) => (
            <g key={c.bodyX}>
              <rect x={c.wickX} y={c.wickY} width={c.wickWidth} height={c.wickHeight} fill="white" />
              <rect x={c.bodyX} y={c.bodyY} width={c.bodyWidth} height={c.bodyHeight} rx="2" fill="white" />
            </g>
          ))}
        </mask>
        <g mask={`url(#${maskId})`}>
          <rect width="100%" height={height} fill={`url(#${gradientId})`} />
        </g>
      </svg>
    </Flex>
  )
}

function MarginStatsStrip({
  pairKey,
  routedVenue,
  stats24h,
}: {
  pairKey: MarginPairKey | undefined
  // Once the open quote names a venue, the strip's venue-level numbers (borrow APY, liquidity, LLTV)
  // must be that venue's, not the pair's first — those are what the position would actually get.
  // Before then it stays on the pair group, which is all that is known.
  routedVenue?: MarginVenue
  stats24h: MarginChartData['stats24h']
}): JSX.Element {
  const { t } = useTranslation()
  const locale = useCurrentLocale()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()
  const { getPairMarkets, getLive, markets } = useMarginMarkets()
  const currencyInfos = useMarginCurrencyInfos()
  const pairMarkets = getPairMarkets(pairKey)
  const market =
    (routedVenue ? pairMarkets.find((pairMarket) => pairMarket.venue === routedVenue) : undefined) ??
    pairMarkets.at(0) ??
    markets.at(0)
  // The headline must agree with the form's slider, so it maxes over the same allowed venue set.
  const { allowedMarkets } = useMarginVenueAllowlist({ market })

  if (!market) {
    return (
      <Flex row alignItems="center" gap="$spacing12" flexWrap="wrap">
        <Text variant="body3" color="$neutral2">
          {t('margin.market.empty')}
        </Text>
      </Flex>
    )
  }

  const live = getLive(market.key)
  const mark = live ? scaledE18ToNumber(live.markPriceX18) : undefined
  const lltvWad = live ? live.lltvWad : market.lltvWad
  const lltv = lltvToPercent(lltvWad)
  const maxLev = getMarginLeverageCap({ markets: allowedMarkets })
  const liquidity = live
    ? formatMarginDebtUnits({
        raw: live.availableBorrowLiquidity,
        decimals: market.debt.decimals,
        symbol: marginUnwrapSymbol(market.debt),
        locale,
      })
    : undefined

  // Signed, colored 24h change. formatPercent emits the locale minus for negatives, so only
  // positives need an explicit "+". Omitted entirely when the day series can't yield a change.
  const changePct = stats24h.changePct
  const change24h =
    changePct !== undefined
      ? { text: `${changePct >= 0 ? '+' : ''}${formatPercent(changePct, 1)}`, positive: changePct >= 0 }
      : undefined

  // Secondary metrics as one "·"-joined cluster, subordinate to the primary identity above. Some
  // carry a hover explainer (spec F24 channel 2).
  const venueLabel = marginVenueLabel(market.venue)
  const secondaryStats: Array<{ key: string; text: string; tooltip?: string }> = []
  if (live && live.borrowApyBps !== undefined) {
    secondaryStats.push({
      key: 'apy',
      text: t('margin.stats.borrowApy', { apy: bpsToPercent(live.borrowApyBps).toFixed(2) }),
      tooltip: t('margin.stats.tooltip.apy', { venue: venueLabel }),
    })
  }
  if (liquidity) {
    secondaryStats.push({
      key: 'liquidity',
      text: t('margin.stats.liquidity', { amount: liquidity }),
      tooltip: t('margin.stats.tooltip.liquidity', { venue: venueLabel }),
    })
  }
  // Both variants quote a max, so neither can render before one is known — no cap is derivable from
  // lltv any more.
  if (maxLev !== undefined) {
    secondaryStats.push(
      lltvWad !== '0'
        ? {
            key: 'lltvMax',
            text: t('margin.stats.lltvMax', { lltv: lltv.toFixed(0), max: formatMaxLeverage(maxLev) }),
            tooltip: t('margin.stats.tooltip.lltvMax', { lltv: lltv.toFixed(0) }),
          }
        : { key: 'maxLev', text: t('margin.stats.maxLeverage', { max: formatMaxLeverage(maxLev) }) },
    )
  }
  if (stats24h.high !== undefined) {
    secondaryStats.push({
      key: 'high',
      text: t('margin.stats.high24h', { value: convertFiatAmountFormatted(stats24h.high, NumberType.FiatTokenPrice) }),
    })
  }
  if (stats24h.low !== undefined) {
    secondaryStats.push({
      key: 'low',
      text: t('margin.stats.low24h', { value: convertFiatAmountFormatted(stats24h.low, NumberType.FiatTokenPrice) }),
    })
  }

  return (
    <Flex row alignItems="center" gap="$spacing12" flexWrap="wrap">
      {/* Primary identity: split logo + pair + hero mark price + data-source tooltip + real 24h change.
          Two wrap clusters (identity, price+meta) so a narrow column drops the price to line 2, identity intact. */}
      <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap" flexShrink={1} minWidth={0}>
        <Flex row alignItems="center" gap="$spacing12">
          <SplitLogo
            size={28}
            chainId={MARGIN_CHAIN_ID}
            inputCurrencyInfo={null}
            outputCurrencyInfo={null}
            {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
          />
          <Text variant="heading3" color="$neutral1">
            {marginPairLabel({ market })}
          </Text>
        </Flex>
        <Flex row alignItems="center" gap="$spacing8">
          {mark !== undefined ? (
            <>
              <Text variant="heading3" color="$neutral3">
                ·
              </Text>
              <Text variant="heading3" color="$neutral1">
                {convertFiatAmountFormatted(mark, NumberType.FiatTokenPrice)}
              </Text>
            </>
          ) : null}
          <Tooltip placement="bottom" delay={{ open: 200, close: 0 }}>
            <Tooltip.Trigger>
              <InfoCircleFilled size="$icon.16" color="$neutral3" />
            </Tooltip.Trigger>
            <Tooltip.Content>
              <Tooltip.Arrow />
              {/* Charted-series tooltips name the volatile leg — the debt token on shorts. */}
              <Text variant="body4">
                {t('margin.chart.source.tooltip', { symbol: marginUnwrapSymbol(volatileLeg({ market })) })}
              </Text>
            </Tooltip.Content>
          </Tooltip>
          {change24h ? (
            <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
              <Tooltip.Trigger>
                <Text variant="body2" color={change24h.positive ? '$statusSuccess' : '$statusCritical'}>
                  {t('margin.stats.change24h', { change: change24h.text })}
                </Text>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <Tooltip.Arrow />
                <Text variant="body4">
                  {t('margin.stats.tooltip.change24h', { symbol: marginUnwrapSymbol(volatileLeg({ market })) })}
                </Text>
              </Tooltip.Content>
            </Tooltip>
          ) : null}
        </Flex>
      </Flex>
      {/* Secondary metrics. flexShrink lets the cluster shrink to the column so flexWrap
          can drop stats to a second line instead of overflowing on a narrow chart. */}
      <Flex row alignItems="center" gap="$spacing8" flexWrap="wrap" flexShrink={1} minWidth={0}>
        {secondaryStats.map((stat, i) => (
          <Flex key={stat.key} row alignItems="center" gap="$spacing8">
            {stat.tooltip ? (
              <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
                <Tooltip.Trigger>
                  <Text variant="body3" color="$neutral2">
                    {stat.text}
                  </Text>
                </Tooltip.Trigger>
                <Tooltip.Content>
                  <Tooltip.Arrow />
                  <Text variant="body4">{stat.tooltip}</Text>
                </Tooltip.Content>
              </Tooltip>
            ) : (
              <Text variant="body3" color="$neutral2">
                {stat.text}
              </Text>
            )}
            {/* Trailing separator: on wrap it dangles at a line end, never orphaned at a line start. */}
            {i < secondaryStats.length - 1 ? (
              <Text variant="body3" color="$neutral3">
                ·
              </Text>
            ) : null}
          </Flex>
        ))}
      </Flex>
    </Flex>
  )
}
