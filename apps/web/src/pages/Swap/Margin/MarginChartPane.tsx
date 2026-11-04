import { Button, Flex, Text, Tooltip } from '@universe/mycelium'
/* oxlint-disable max-lines */
import { EXIT_PRESET_CLASSES } from '@universe/mycelium/compat'
import { CandlestickChart } from '@universe/mycelium/icons/CandlestickChart'
import { LineChartDots } from '@universe/mycelium/icons/LineChartDots'
import { RotatableChevron } from '@universe/mycelium/icons/RotatableChevron'
import { Presence } from '@universe/mycelium/presence'
import { SegmentedControl } from '@universe/mycelium/segmented-control-compat'
import { SPORE_ANIMATION_CURVE_CSS } from '@universe/tailwind/animations'
import { TestID } from '@universe/test'
import { useParentSize } from '@visx/responsive'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
import { getMarginPairLogoProps, useMarginCurrencyInfos } from '~/features/margin/hooks/useMarginCurrencyInfos'
import { useMarginMarkets } from '~/features/margin/hooks/useMarginMarkets'
import {
  accruedUsd,
  bpsToPercent,
  formatMarginDebtUnits,
  formatMaxLeverage,
  formatSignedFiat,
  lltvToPercent,
  marginVenueLabel,
  scaledE18ToNumber,
} from '~/features/margin/utils/marginFormat'
import {
  marginMarketDirection,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapSymbol,
} from '~/features/margin/utils/marginTokenDisplay'
import { extrapolateAccrued } from '~/pages/Swap/Margin/chart/marginChartMath'
import { MarginChartOhlcLegend } from '~/pages/Swap/Margin/chart/MarginChartOhlcLegend'
import { type MarginChartPrefs, useMarginChartPrefs } from '~/pages/Swap/Margin/chart/marginChartPrefsStore'
import { MarginChartSettings } from '~/pages/Swap/Margin/chart/MarginChartSettings'
import { MarginChartTooltip, type MarginTooltipData } from '~/pages/Swap/Margin/chart/MarginChartTooltip'
import { MarginChartZoomButtons } from '~/pages/Swap/Margin/chart/MarginChartZoomButtons'
import { MARGIN_TIME_WINDOW_OPTIONS, type MarginTimeWindow } from '~/pages/Swap/Margin/chart/marginTimeWindows'
import { useMarginChartData, volatileLeg, type MarginChartData } from '~/pages/Swap/Margin/chart/useMarginChartData'
import { useMarginChartOverlays, type MarginChartOverlays } from '~/pages/Swap/Margin/chart/useMarginChartOverlays'
import { useMarginVolume } from '~/pages/Swap/Margin/chart/useMarginVolume'
import { MAX_VERTICAL_ZOOM_STEP } from '~/pages/Swap/Margin/chart/verticalZoom'
import { MarginFormMarketsState } from '~/pages/Swap/Margin/components/MarginFormMarketsState'
import { MarginMarketSelectorAnchor } from '~/pages/Swap/Margin/components/MarginMarketSelector'
import { setMarginChartHoveredCandle } from '~/pages/Swap/Margin/hooks/useMarginChartHoveredCandle'
import { useMarginVenueAllowlist } from '~/pages/Swap/Margin/hooks/useMarginVenueAllowlist'
import { MARGIN_TIME_AXIS_HEIGHT, marginVolumePaneHeight } from '~/pages/Swap/Margin/marginChartLayout'
import { MarginChartSkeleton } from '~/pages/Swap/Margin/MarginChartSkeleton'
import { useMarginMorph } from '~/pages/Swap/Margin/MarginMorphContext'
import { getMarginLeverageCap } from '~/pages/Swap/Margin/marginOpenButtonGate'
import { MarginPriceChartModel } from '~/pages/Swap/Margin/MarginPriceChartModel'

const TIME_WINDOW_OPTIONS = MARGIN_TIME_WINDOW_OPTIONS.map((timeWindow) => ({
  value: timeWindow,
  displayText: timeWindow,
}))
// The chart box fills whatever height the terminal layout gives the chart block, minus the stats strip,
// legend and controls row; the volume pane, when shown, takes its share from inside it. Stand-in for
// overlay label spacing until that box is first measured.
const MARGIN_CHART_FALLBACK_HEIGHT = 480

// Hold the chart behind the skeleton this long after mount, then cross-fade in — enough to clear the
// model's first-frame setup (the height-ease and volume-pane shifts are fixed at the source).
const CHART_REVEAL_DELAY_MS = 220
// Chart overlays (volume title, legend chip) mount with the chart but fade in with it on reveal.
const OVERLAY_REVEAL_STYLE = { transition: `opacity ${SPORE_ANIMATION_CURVE_CSS.fast}` }

/**
 * `compact` fits the pane to a phone-width box (the mobile chart sheets): the stats wrap instead of
 * running past the edge, and the vertical-zoom buttons give way to pinch, so the controls fit one row.
 *
 * `pinnedMarket` charts that market instead of the form's, for a surface about one position (the mobile
 * position sheet). The pair header and OHLC legend are dropped there: the header is the form's market
 * picker, and the surface carries its own identity.
 */
export function MarginChartPane({
  compact = false,
  pinnedMarket,
  focusPositionId,
}: {
  compact?: boolean
  pinnedMarket?: MarginMarket
  // Draws only this position's overlays, always shown (see useMarginChartOverlays).
  focusPositionId?: string
} = {}): JSX.Element {
  const pairKey = useMarginFormStore((s) => s.pairKey)
  const { getPairMarket, markets, isLoading, isFetching, error, refetch } = useMarginMarkets()
  // A populated registry with a momentarily-stale stored key still shows the first available
  // market instead of the unavailable state — matches PairHeaderButton/MarginStatsStrip's own
  // resolution, so all three surfaces agree on "unavailable" only when the registry is truly empty.
  const formMarket = getPairMarket(pairKey) ?? markets.at(0)
  const market = pinnedMarket ?? formMarket

  if (!market) {
    return (
      <Flex fill minHeight={0} gap="$spacing8">
        <MarginStatsStrip pairKey={pairKey} stats24h={{}} compact={compact} />
        <Flex height={1} flexShrink={0} backgroundColor="$surface3" />
        <Flex flex={1} minHeight={0} alignItems="center" justifyContent="center">
          <MarginFormMarketsState isLoading={isLoading || isFetching} error={error} onRetry={refetch} />
        </Flex>
      </Flex>
    )
  }

  return (
    <MarginChartPaneBody
      market={market}
      previewMarket={formMarket ?? market}
      pairKey={pairKey}
      compact={compact}
      showHeader={!pinnedMarket}
      focusPositionId={focusPositionId}
    />
  )
}

// Mounts only once the pane's gate resolves a market: the chart data, volume and overlay hooks all
// require one.
function MarginChartPaneBody({
  market,
  previewMarket,
  pairKey,
  compact,
  showHeader,
  focusPositionId,
}: {
  market: MarginMarket
  previewMarket: MarginMarket
  pairKey: MarginPairKey | undefined
  compact: boolean
  showHeader: boolean
  focusPositionId: string | undefined
}): JSX.Element {
  const { t } = useTranslation()
  const [timeWindow, setTimeWindow] = useState<MarginTimeWindow>('1D')
  // Chart-settings popover open state, lifted so the chart suppresses its crosshair/tooltip while the
  // panel is open (spec F16) — on short viewports the panel overlays the chart.
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  // No debounce: the block is already at its final size (gated in MarginTerminalLayout), so the chart
  // measures it once and fits its content once.
  const { parentRef, width, height } = useParentSize({ debounceTime: 0 })
  // Mount lightweight-charts only once the layout morph settles; the skeleton bridges until then.
  const { morphSettled } = useMarginMorph()

  const { candles, quality, loading, error, refetch, stats24h, candlesUnavailable } = useMarginChartData({
    market,
    timeWindow,
  })

  // Chart style (spec F14): the persisted pref drives the toggle, but line-only fallback markets have
  // no real OHLC, so the effective type is forced to line there regardless of the pref.
  const chartStyle = useMarginChartPrefs((s) => s.chartStyle)
  const setChartPrefs = useMarginChartPrefs((s) => s.setChartPrefs)
  // Optional volume histogram (spec F15), default OFF. The data hook stays prefs-agnostic — the pane
  // gates it via `enabled` so the query is skipped while the overlay is off.
  const volumeEnabled = useMarginChartPrefs((s) => s.volume)
  const { volumeBars } = useMarginVolume({
    market,
    timeWindow,
    enabled: volumeEnabled,
  })
  const showVolumePane = volumeEnabled && volumeBars.length > 0
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
  const onCrosshairChange = useEvent((candle?: PriceChartData): void => setMarginChartHoveredCandle(candle))
  // The legend must not keep reading a candle from a chart that is gone.
  useEffect(() => () => setMarginChartHoveredCandle(undefined), [])
  // Ascending candle times (the data hook sorts) fed to the composer for event-marker snapping.
  const candleTimes = useMemo(() => candles.map((c) => c.time), [candles])
  const overlays = useMarginChartOverlays({
    market,
    previewMarket,
    focusPositionId,
    candleTimes,
    // Fallback mark for the preview estimate when the live market mark is absent (e.g. a venue that
    // can't quote) — keeps Entry/Liq on the chart instead of blanking them.
    markFallback: candles.at(-1)?.close,
    visiblePriceRange: visibleRange,
    // The price pane only: the volume pane, when shown, is carved out of the same box.
    paneHeightPx: (height || MARGIN_CHART_FALLBACK_HEIGHT) - (showVolumePane ? marginVolumePaneHeight(height) : 0),
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
      // The tooltip carries its own chrome and renders nothing for an OHLC-only hover (the legend
      // above the chart reads that), so the shared shell would paint an empty pill.
      hideTooltipBorder: true,
      overlays,
      onVisibleRangeChange,
      volumeBars: showVolumePane ? volumeBars : undefined,
      boxHeight: height,
      suppressCrosshair: isSettingsOpen,
      verticalZoomStep,
    }),
    [
      candles,
      effectiveChartType,
      quality,
      overlays,
      onVisibleRangeChange,
      showVolumePane,
      volumeBars,
      height,
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

  // Mount once it has a box + data, but keep it hidden behind the skeleton for a beat then cross-fade in,
  // so the model's first-frame setup never shows as a "resize".
  const chartMounted = morphSettled && candles.length > 0 && width > 0 && height > 0
  const [chartRevealed, setChartRevealed] = useState(false)
  useEffect(() => {
    if (!chartMounted) {
      setChartRevealed(false)
      return undefined
    }
    const id = setTimeout(() => setChartRevealed(true), CHART_REVEAL_DELAY_MS)
    return () => clearTimeout(id)
  }, [chartMounted])
  // Terminal states, gated before the chart mounts. Error only when there's nothing to fall back
  // to — an error alongside existing candles keeps the (stale) chart. Empty gates on !loading so
  // the skeleton bridges both the initial fetch and the line-only fallback's own loading window,
  // never flashing empty copy in between.
  const showError = Boolean(error) && candles.length === 0
  const showEmpty = !loading && (candles.length === 0 || quality === DataQuality.INVALID)

  return (
    <Flex fill minHeight={0} gap="$spacing8">
      {showHeader ? (
        <>
          <MarginStatsStrip
            compact={compact}
            pairKey={pairKey}
            routedVenue={overlays.routedVenue}
            stats24h={stats24h}
            markPrice={candles.at(-1)?.close}
          />
          <Flex height={1} flexShrink={0} backgroundColor="$surface3" />
          <MarginChartOhlcLegend latest={candles.at(-1)} />
        </>
      ) : null}
      <Flex flex={1} minHeight={0} ref={parentRef} position="relative">
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
          /* Skeleton ⇄ chart crossfade: both fill the box and overlap during the handoff. The chart mounts
             hidden behind the skeleton and fades up when chartRevealed flips, as the skeleton exits. */
          <Presence>
            {chartMounted ? (
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
                style={{
                  isolation: 'isolate',
                  opacity: chartRevealed ? 1 : 0,
                  transition: `opacity ${SPORE_ANIMATION_CURVE_CSS.fast}`,
                }}
              >
                {/* 100%, not the measured px, so it tracks the box instead of lagging a beat behind it. */}
                <Chart
                  Model={MarginPriceChartModel}
                  params={params}
                  height="100%"
                  // The cross-fade owns the entry; a height ease here would read as a resize.
                  animateHeight={false}
                  TooltipBody={TooltipBody}
                  onCrosshairChange={onCrosshairChange}
                />
              </Flex>
            ) : null}
            {!chartRevealed ? (
              <Flex
                key="skeleton"
                position="absolute"
                top={0}
                right={0}
                bottom={0}
                left={0}
                className={EXIT_PRESET_CLASSES.fadeOut}
              >
                <MarginChartSkeleton height={height} testID={TestID.MarginChartSkeleton} />
              </Flex>
            ) : null}
          </Presence>
        )}
        {/* Overlays render with the mounted chart but fade in on reveal, so they never sit over the skeleton. */}
        {chartMounted && showVolumePane ? (
          // Spans the volume pane (above the time axis) so the title sits in the pane's top-left corner.
          <Flex
            position="absolute"
            left={0}
            bottom={MARGIN_TIME_AXIS_HEIGHT}
            height={marginVolumePaneHeight(height)}
            pointerEvents="none"
            zIndex={1}
            opacity={chartRevealed ? 1 : 0}
            style={OVERLAY_REVEAL_STYLE}
          >
            <Flex position="absolute" top="$spacing4" left={0}>
              <Text variant="body4" color="$neutral2">
                {t('margin.chart.settings.volume')}
              </Text>
            </Flex>
          </Flex>
        ) : null}
        {chartMounted && overlays.legend ? (
          <Flex opacity={chartRevealed ? 1 : 0} style={OVERLAY_REVEAL_STYLE}>
            <MarginChartLegendChip
              legend={overlays.legend}
              positionsDataUpdatedAt={overlays.positionsDataUpdatedAt}
              figuresStale={figuresStale ?? false}
            />
          </Flex>
        ) : null}
      </Flex>
      <Flex row alignItems="center" gap="$spacing8">
        <SegmentedControl<MarginTimeWindow>
          size="small"
          outlined
          options={TIME_WINDOW_OPTIONS}
          selectedOption={timeWindow}
          onSelectOption={setTimeWindow}
        />
        <Flex row alignItems="center" gap="$spacing8" marginLeft="auto">
          {compact ? null : (
            <MarginChartZoomButtons
              step={verticalZoomStep}
              zoomAvailable={overlays.autoscaleBounds !== undefined}
              onZoomIn={onZoomIn}
              onZoomOut={onZoomOut}
              onReset={onZoomReset}
            />
          )}
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

// One header stat column: a small muted label over its value (design: Mark · Liquidity · 24H high/low).
// An optional explainer hangs off the label.
function MarginHeaderStat({
  label,
  tooltip,
  children,
}: {
  label: string
  tooltip?: string
  children: ReactNode
}): JSX.Element {
  const labelText = (
    <Text variant="body4" color="$neutral2" $platform-web={{ whiteSpace: 'nowrap' }}>
      {label}
    </Text>
  )
  return (
    <Flex gap="$spacing2" flexShrink={0}>
      {tooltip ? (
        <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
          <Tooltip.Trigger>{labelText}</Tooltip.Trigger>
          <Tooltip.Content>
            <Tooltip.Arrow />
            <Text variant="body4">{tooltip}</Text>
          </Tooltip.Content>
        </Tooltip>
      ) : (
        labelText
      )}
      <Flex row alignItems="center" gap="$spacing4">
        {children}
      </Flex>
    </Flex>
  )
}

// Chart header: the pair identity on the left (logo, pair, and the venue terms under it), the labeled
// market stats on the right, as in the design.
function MarginStatsStrip({
  pairKey,
  routedVenue,
  stats24h,
  markPrice,
  compact = false,
}: {
  pairKey: MarginPairKey | undefined
  // Lets the stat columns shrink to the strip's width, so they wrap rather than overflow it.
  compact?: boolean
  // Once the open quote names a venue, the header's venue-level numbers (borrow APY, liquidity, LLTV)
  // must be that venue's, not the pair's first — those are what the position would actually get.
  // Before then it stays on the pair group, which is all that is known.
  routedVenue?: MarginVenue
  stats24h: MarginChartData['stats24h']
  // The chart's last close (live spot patched in), so the header's Mark and the chart agree.
  markPrice?: number
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
  // The chart's close first: the markets feed's oracle mark is '0' for a market it has no oracle
  // price for, which read as "$0".
  const liveMark = live ? scaledE18ToNumber(live.markPriceX18) : undefined
  const mark = markPrice !== undefined && markPrice > 0 ? markPrice : liveMark && liveMark > 0 ? liveMark : undefined
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

  // Signed, colored 24h change beside the mark. formatPercent emits the locale minus for negatives, so
  // only positives need an explicit "+". Omitted entirely when the day series can't yield a change.
  const changePct = stats24h.changePct
  const change24h =
    changePct !== undefined
      ? { text: `${changePct >= 0 ? '+' : ''}${formatPercent(changePct, 1)}`, positive: changePct >= 0 }
      : undefined

  // The venue terms the design's header has no column for (borrow APY, LLTV, max leverage) sit under
  // the pair, "·"-joined, each with its hover explainer (spec F24 channel 2).
  const venueLabel = marginVenueLabel(market.venue)
  const venueTerms: Array<{ key: string; text: string; tooltip?: string }> = []
  if (live && live.borrowApyBps !== undefined) {
    venueTerms.push({
      key: 'apy',
      text: t('margin.stats.borrowApy', { apy: bpsToPercent(live.borrowApyBps).toFixed(2) }),
      tooltip: t('margin.stats.tooltip.apy', { venue: venueLabel }),
    })
  }
  // Both variants quote a max, so neither can render before one is known — no cap is derivable from
  // lltv any more.
  if (maxLev !== undefined) {
    venueTerms.push(
      lltvWad !== '0'
        ? {
            key: 'lltvMax',
            text: t('margin.stats.lltvMax', { lltv: lltv.toFixed(0), max: formatMaxLeverage(maxLev) }),
            tooltip: t('margin.stats.tooltip.lltvMax', { lltv: lltv.toFixed(0) }),
          }
        : { key: 'maxLev', text: t('margin.stats.maxLeverage', { max: formatMaxLeverage(maxLev) }) },
    )
  }
  const volatileSymbol = marginUnwrapSymbol(volatileLeg({ market }))
  const dash = '—'

  return (
    <Flex row alignItems="center" justifyContent="space-between" gap="$spacing16" flexWrap="wrap">
      {/* Identity: split logo, the pair, and the venue terms under it; opens the market picker, which
          drops down from here (a sheet in the compact layout). Shrinks before the stats do. */}
      <MarginMarketSelectorAnchor compact={compact}>
        {(isSelectorOpen) => (
          <>
            <SplitLogo
              orientation="stacked"
              size={compact ? 32 : 40}
              chainId={MARGIN_CHAIN_ID}
              inputCurrencyInfo={null}
              outputCurrencyInfo={null}
              {...getMarginPairLogoProps({ ...marginPairLegs(market), currencyInfos })}
            />
            <Flex gap="$spacing2" minWidth={0}>
              <Flex row alignItems="center" gap="$spacing4">
                <Text variant="subheading1" color="$neutral1">
                  {marginPairLabel({ market })}
                </Text>
                <RotatableChevron direction={isSelectorOpen ? 'up' : 'down'} size="$icon.16" color="$neutral2" />
              </Flex>
              <Flex row alignItems="center" gap="$spacing6" flexWrap="wrap">
                {venueTerms.map((term, i) => (
                  <Flex key={term.key} row alignItems="center" gap="$spacing6">
                    {term.tooltip ? (
                      <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
                        <Tooltip.Trigger>
                          <Text variant="body4" color="$neutral2">
                            {term.text}
                          </Text>
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          <Tooltip.Arrow />
                          <Text variant="body4">{term.tooltip}</Text>
                        </Tooltip.Content>
                      </Tooltip>
                    ) : (
                      <Text variant="body4" color="$neutral2">
                        {term.text}
                      </Text>
                    )}
                    {/* Trailing separator: on wrap it dangles at a line end, never orphaned at a start. */}
                    {i < venueTerms.length - 1 ? (
                      <Text variant="body4" color="$neutral3">
                        ·
                      </Text>
                    ) : null}
                  </Flex>
                ))}
              </Flex>
            </Flex>
          </>
        )}
      </MarginMarketSelectorAnchor>
      {/* Labeled stat columns, flush right. */}
      <Flex
        row
        alignItems="center"
        gap="$spacing24"
        rowGap={compact ? '$spacing12' : undefined}
        flexWrap="wrap"
        flexShrink={compact ? 1 : undefined}
        minWidth={compact ? 0 : undefined}
      >
        {/* Charted-series tooltips name the volatile leg — the debt token on shorts. */}
        <MarginHeaderStat
          label={t('margin.stats.label.mark')}
          tooltip={t('margin.chart.source.tooltip', { symbol: volatileSymbol })}
        >
          <Text variant="body3" color="$neutral1" $platform-web={{ whiteSpace: 'nowrap' }}>
            {mark !== undefined ? convertFiatAmountFormatted(mark, NumberType.FiatTokenPrice) : dash}
          </Text>
          {change24h ? (
            <Tooltip placement="top" delay={{ open: 200, close: 0 }}>
              <Tooltip.Trigger>
                <Text variant="body4" color={change24h.positive ? '$statusSuccess' : '$statusCritical'}>
                  {change24h.text}
                </Text>
              </Tooltip.Trigger>
              <Tooltip.Content>
                <Tooltip.Arrow />
                <Text variant="body4">{t('margin.stats.tooltip.change24h', { symbol: volatileSymbol })}</Text>
              </Tooltip.Content>
            </Tooltip>
          ) : null}
        </MarginHeaderStat>
        <MarginHeaderStat
          label={t('margin.stats.label.liquidity')}
          tooltip={t('margin.stats.tooltip.liquidity', { venue: venueLabel })}
        >
          <Text variant="body3" color="$neutral1" $platform-web={{ whiteSpace: 'nowrap' }}>
            {liquidity ?? dash}
          </Text>
        </MarginHeaderStat>
        <MarginHeaderStat label={t('margin.stats.label.high24h')}>
          <Text variant="body3" color="$neutral1" $platform-web={{ whiteSpace: 'nowrap' }}>
            {stats24h.high !== undefined ? convertFiatAmountFormatted(stats24h.high, NumberType.FiatTokenPrice) : dash}
          </Text>
        </MarginHeaderStat>
        <MarginHeaderStat label={t('margin.stats.label.low24h')}>
          <Text variant="body3" color="$neutral1" $platform-web={{ whiteSpace: 'nowrap' }}>
            {stats24h.low !== undefined ? convertFiatAmountFormatted(stats24h.low, NumberType.FiatTokenPrice) : dash}
          </Text>
        </MarginHeaderStat>
      </Flex>
    </Flex>
  )
}
