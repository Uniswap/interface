import { ProtocolVersion as RestProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import {
  AreaSeriesPartialOptions,
  BarPrice,
  DeepPartial,
  ISeriesApi,
  LineType,
  Time,
  TimeChartOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useSporeColors } from 'ui/src'
import { opacify } from 'ui/src/theme'
import { BIPS_BASE, ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { useGetPoolsByTokens } from 'uniswap/src/data/rest/getPools'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { NumberType } from 'utilities/src/format/types'
import { ChartHeader } from '~/components/Charts/ChartHeader'
import { Chart, ChartModel, ChartModelParams } from '~/components/Charts/ChartModel'
import { ChartSkeleton } from '~/components/Charts/LoadingState'
import { ChartType } from '~/components/Charts/utils'
import { SubscriptZeroPrice } from '~/components/SubscriptZeroPrice'
import { LoadingChart } from '~/features/Explore/chart/LoadingChart'
import { useLiquidityBarData } from '~/features/Liquidity/charts/LiquidityChart'
import { getTokenOrZeroAddress } from '~/features/Liquidity/utils/currency'
import {
  buildDepthData,
  DepthPoint,
  getDisplayPair,
  getGapTime,
  toDisplayPrice,
} from '~/pages/PoolDetails/components/ChartSection/DepthChart.utils'
import { DepthTooltipBody } from '~/pages/PoolDetails/components/ChartSection/DepthChartTooltip'

const PDP_CHART_HEIGHT_PX = 356

// Minimum real bars (excluding the active-tick anchor) required on EACH side of the active price
// before the depth chart is considered informative. Below this, render the standard chart-error
// skeleton instead of a sparse, misleading staircase.
const MIN_DEPTH_BARS_PER_SIDE = 4

export type DepthChartZoomActions = {
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
}

interface DepthChartModelParams extends ChartModelParams<DepthPoint> {
  sellData: DepthPoint[]
  buyData: DepthPoint[]
  sellColor: string
  buyColor: string
  isReversed: boolean
  onZoomActionsReady?: (actions: DepthChartZoomActions) => void
}

// Fraction of the full data range to show initially — smaller = more zoomed in on the spread.
const INITIAL_ZOOM_FRACTION = 0.4
// Clamp zoom so the chart never collapses onto itself (too zoomed in) or shows the full
// many-orders-of-magnitude tick range (too zoomed out).
const MIN_VISIBLE_POINTS = 10
const MAX_VISIBLE_FRACTION = 0.6

class DepthChartModel extends ChartModel<DepthPoint> {
  // `this.series` is the hidden catch-all series used for crosshair hover resolution in the
  // base class. The visible sell/buy series render the colored depth regions.
  protected series: ISeriesApi<'Area'>
  private sellSeries: ISeriesApi<'Area'>
  private buySeries: ISeriesApi<'Area'>
  private timeToPrice = new Map<number, number>()
  private totalPoints = 0
  private sellCount = 0
  private gapTime: UTCTimestamp | null = null
  private isReversed: boolean

  constructor(chartDiv: HTMLDivElement, params: DepthChartModelParams) {
    const { combined, gapTime } = DepthChartModel.buildCombinedWithGap(params)
    super(chartDiv, { ...params, data: combined })
    this.series = this.api.addAreaSeries()
    this.sellSeries = this.api.addAreaSeries()
    this.buySeries = this.api.addAreaSeries()
    this.series.setData(combined)
    this.sellSeries.setData(params.sellData)
    this.buySeries.setData(params.buyData)
    this.totalPoints = combined.length
    this.sellCount = params.sellData.length
    this.gapTime = gapTime
    this.isReversed = params.isReversed
    this.rebuildTimeToPrice(params)

    chartDiv.addEventListener('wheel', this.depthWheelHandler, { passive: false, capture: true })

    this.updateOptions(params)
    this.fitContent()
    this.applyInitialZoom(this.sellCount, this.totalPoints)

    params.onZoomActionsReady?.({
      zoomIn: () => this.zoomByFactor(1.5),
      zoomOut: () => this.zoomByFactor(1 / 1.5),
      resetView: () => this.applyInitialZoom(this.sellCount, this.totalPoints),
    })
  }

  // Injects an invisible midpoint datum between sell and buy into the hidden catch-all series
  // so the crosshair fires hover events when the cursor is in the empty gap between sides.
  private static buildCombinedWithGap(params: DepthChartModelParams): {
    combined: DepthPoint[]
    gapTime: UTCTimestamp | null
  } {
    const gap = getGapTime(params.sellData, params.buyData)
    if (gap === null) {
      return { combined: [...params.sellData, ...params.buyData], gapTime: null }
    }
    const gapTime = gap as UTCTimestamp
    // Sentinel point — never surfaced in the tooltip (special-cased on `gapTime`).
    const gapPoint: DepthPoint = {
      time: gapTime,
      value: 0,
      tick: 0,
      price: 0,
      activeLiquidity: 0,
      swapToMove: 0,
      inputIsToken0: false,
      side: 'sell',
    }
    return {
      combined: [...params.sellData, gapPoint, ...params.buyData],
      gapTime,
    }
  }

  private zoomByFactor(factor: number) {
    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const center = (visibleRange.from + visibleRange.to) / 2
    const halfRange = (visibleRange.to - visibleRange.from) / 2
    const clamped = this.clampHalfRange(halfRange / factor)
    timeScale.setVisibleLogicalRange({ from: center - clamped, to: center + clamped })
  }

  private rebuildTimeToPrice(params: DepthChartModelParams) {
    this.timeToPrice.clear()
    for (const p of params.sellData) {
      this.timeToPrice.set(p.time as number, toDisplayPrice(p.price, params.isReversed))
    }
    for (const p of params.buyData) {
      this.timeToPrice.set(p.time as number, toDisplayPrice(p.price, params.isReversed))
    }
  }

  // Centers the initial view on the injected gap-midpoint (logical index = sellCount), which
  // sits exactly between sell and buy sides regardless of asymmetric liquidity.
  private applyInitialZoom(sellCount: number, totalCount: number) {
    if (totalCount === 0) {
      return
    }
    const timeScale = this.api.timeScale()
    const minHalfRange = MIN_VISIBLE_POINTS / 2
    const maxHalfRange = (totalCount * MAX_VISIBLE_FRACTION) / 2
    // For very sparse pools, the min-visible-points floor would force a window wider than
    // the data itself, leaving most of the chart empty. Just fit the data instead.
    if (maxHalfRange < minHalfRange) {
      timeScale.fitContent()
      return
    }
    const center = this.gapTime === null ? sellCount - 0.5 : sellCount
    const halfWidth = this.clampHalfRange((totalCount / 2) * INITIAL_ZOOM_FRACTION)
    timeScale.setVisibleLogicalRange({ from: center - halfWidth, to: center + halfWidth })
  }

  private clampHalfRange(rawHalfRange: number): number {
    const minHalfRange = MIN_VISIBLE_POINTS / 2
    const maxHalfRange = (this.totalPoints * MAX_VISIBLE_FRACTION) / 2
    return Math.max(minHalfRange, Math.min(maxHalfRange, rawHalfRange))
  }

  // Re-reads the current visible range and clamps its width. Used after the base class's
  // Ctrl+wheel pinch-zoom fires so trackpad pinch can't bypass our min/max zoom.
  private enforceZoomClamp() {
    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const half = (visibleRange.to - visibleRange.from) / 2
    const clamped = this.clampHalfRange(half)
    if (clamped === half) {
      return
    }
    const center = (visibleRange.from + visibleRange.to) / 2
    timeScale.setVisibleLogicalRange({ from: center - clamped, to: center + clamped })
  }

  // Trackpad: horizontal scroll → pan, vertical scroll → zoom. Ctrl+wheel (macOS pinch)
  // runs through the base class's handler first; we enforce the clamp afterwards so pinch
  // can't bypass our min/max zoom.
  private depthWheelHandler = (event: WheelEvent): void => {
    if (event.ctrlKey) {
      this.enforceZoomClamp()
      return
    }
    event.preventDefault()
    event.stopPropagation()

    const timeScale = this.api.timeScale()
    const visibleRange = timeScale.getVisibleLogicalRange()
    if (!visibleRange) {
      return
    }
    const rangeWidth = visibleRange.to - visibleRange.from

    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
      const panAmount = (event.deltaX / 200) * rangeWidth
      let newFrom = visibleRange.from + panAmount
      let newTo = visibleRange.to + panAmount
      const maxIndex = this.totalPoints - 1
      if (rangeWidth >= this.totalPoints) {
        return
      }
      if (newFrom < 0) {
        newTo -= newFrom
        newFrom = 0
      }
      if (newTo > maxIndex) {
        newFrom -= newTo - maxIndex
        newTo = maxIndex
      }
      timeScale.setVisibleLogicalRange({ from: newFrom, to: newTo })
    } else {
      const zoomFactor = event.deltaY > 0 ? 0.95 : 1.05
      const center = (visibleRange.from + visibleRange.to) / 2
      const clampedHalfRange = this.clampHalfRange(rangeWidth / 2 / zoomFactor)
      timeScale.setVisibleLogicalRange({
        from: center - clampedHalfRange,
        to: center + clampedHalfRange,
      })
    }
  }

  override remove() {
    this.chartDiv.removeEventListener('wheel', this.depthWheelHandler, { capture: true })
    super.remove()
  }

  override updateOptions(params: DepthChartModelParams) {
    const reversedChanged = this.isReversed !== params.isReversed
    const { combined, gapTime } = DepthChartModel.buildCombinedWithGap(params)
    this.rebuildTimeToPrice(params)
    this.totalPoints = combined.length
    this.sellCount = params.sellData.length
    this.gapTime = gapTime
    this.isReversed = params.isReversed
    const nonDefault: DeepPartial<TimeChartOptions> = {
      localization: {
        priceFormatter: (price: BarPrice) =>
          params.format.convertFiatAmountFormatted(Number(price), NumberType.FiatTokenStats),
      },
      leftPriceScale: {
        visible: false,
        borderVisible: false,
        minimumWidth: 0,
      },
      rightPriceScale: {
        visible: false,
        borderVisible: false,
        minimumWidth: 0,
        scaleMargins: { top: 0.1, bottom: 0 },
        autoScale: true,
      },
      timeScale: {
        visible: true,
        borderVisible: false,
        ticksVisible: true,
        timeVisible: true,
        fixLeftEdge: false,
        fixRightEdge: false,
        tickMarkFormatter: (time: Time) => {
          const price = this.timeToPrice.get(time as number)
          return price === undefined
            ? ''
            : params.format.formatNumberOrString({ value: price, type: NumberType.TokenTx })
        },
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
    }
    super.updateOptions(params, nonDefault)

    // All three series share the left price scale so sell/buy sides are comparable on the same y-axis.
    this.series.applyOptions({
      priceScaleId: 'right',
      lineColor: 'transparent',
      topColor: 'transparent',
      bottomColor: 'transparent',
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    })

    const commonOptions: AreaSeriesPartialOptions = {
      lineType: LineType.WithSteps,
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerRadius: 0,
    }

    this.sellSeries.applyOptions({
      ...commonOptions,
      priceScaleId: 'right',
      lineColor: params.sellColor,
      topColor: opacify(40, params.sellColor),
      bottomColor: opacify(0, params.sellColor),
    })
    this.buySeries.applyOptions({
      ...commonOptions,
      priceScaleId: 'right',
      lineColor: params.buyColor,
      topColor: opacify(40, params.buyColor),
      bottomColor: opacify(0, params.buyColor),
    })

    this.series.setData(combined)
    this.sellSeries.setData(params.sellData)
    this.buySeries.setData(params.buyData)

    if (reversedChanged) {
      this.applyInitialZoom(this.sellCount, this.totalPoints)
    }
  }
}

export function DepthChart({
  tokenA,
  tokenB,
  feeTier,
  isReversed,
  chainId,
  version,
  hooks,
  poolId,
  onZoomActionsReady,
}: {
  tokenA: Currency
  tokenB: Currency
  feeTier: FeeAmount
  isReversed: boolean
  chainId: UniverseChainId
  version: RestProtocolVersion
  hooks?: string
  poolId?: string
  onZoomActionsReady?: (actions: DepthChartZoomActions) => void
}) {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const tokenADescriptor = tokenA.symbol ?? tokenA.name ?? t('common.tokenA')
  const tokenBDescriptor = tokenB.symbol ?? tokenB.name ?? t('common.tokenB')

  const { data: poolData } = useGetPoolsByTokens(
    {
      fee: feeTier,
      chainId,
      protocolVersions: [version],
      token0: getTokenOrZeroAddress(tokenA),
      token1: getTokenOrZeroAddress(tokenB),
      hooks: hooks ?? ZERO_ADDRESS,
    },
    true,
  )

  const sdkCurrencies = useMemo(() => ({ TOKEN0: tokenA, TOKEN1: tokenB }), [tokenA, tokenB])

  const { tickData, activeTick, loading } = useLiquidityBarData({
    sdkCurrencies,
    feeTier,
    isReversed,
    chainId,
    version,
    hooks,
    poolId,
    tickSpacing: poolData?.pools[0]?.tickSpacing,
  })

  const { sellData, buyData, midPrice } = useMemo(() => {
    if (!tickData?.barData || activeTick === undefined) {
      return { sellData: [], buyData: [], midPrice: 0 }
    }
    return buildDepthData({
      barData: tickData.barData,
      activeTick,
      feeTier,
      token0Decimals: tokenA.decimals,
      token1Decimals: tokenB.decimals,
      isReversed,
    })
  }, [tickData, activeTick, feeTier, tokenA.decimals, tokenB.decimals, isReversed])

  // Lightweight-charts' built-in AreaSeries only round-trips `time` and `value`. To expose
  // the rest of each point (tick, price, activeLiquidity, swapToMove) in the tooltip we
  // look up by `time` against the source arrays.
  const pointByTime = useMemo(() => {
    const map = new Map<number, DepthPoint>()
    for (const p of sellData) {
      map.set(p.time as number, p)
    }
    for (const p of buyData) {
      map.set(p.time as number, p)
    }
    return map
  }, [sellData, buyData])

  const gapTime = useMemo(() => getGapTime(sellData, buyData), [sellData, buyData])

  const params = useMemo(
    () => ({
      data: [...sellData, ...buyData] as DepthPoint[],
      sellData,
      buyData,
      sellColor: colors.statusCritical.val,
      buyColor: colors.statusSuccess.val,
      isReversed,
      hideTooltipBorder: true,
      onZoomActionsReady,
    }),
    [sellData, buyData, colors.statusSuccess, colors.statusCritical, isReversed, onZoomActionsReady],
  )

  if (loading) {
    return <LoadingChart />
  }

  // Each side's array includes a 1-point anchor at the active tick that doesn't represent real liquidity.
  const realSellBars = Math.max(0, sellData.length - 1)
  const realBuyBars = Math.max(0, buyData.length - 1)
  if (realSellBars < MIN_DEPTH_BARS_PER_SIDE || realBuyBars < MIN_DEPTH_BARS_PER_SIDE) {
    return <ChartSkeleton type={ChartType.LIQUIDITY} height={PDP_CHART_HEIGHT_PX} errorText={t('chart.error.pools')} />
  }

  return (
    <Chart
      height={PDP_CHART_HEIGHT_PX}
      Model={DepthChartModel}
      params={params}
      TooltipBody={({ data }: { data: DepthPoint }) => (
        <DepthTooltipBody
          data={data}
          pointByTime={pointByTime}
          tokenA={tokenA}
          tokenB={tokenB}
          isReversed={isReversed}
          gapTime={gapTime}
          feeTierLabel={`${feeTier / BIPS_BASE}%`}
        />
      )}
    >
      {(crosshair) => {
        const hoveredPrice = crosshair ? pointByTime.get(crosshair.time as number)?.price : undefined
        const displayPrice = toDisplayPrice(hoveredPrice ?? midPrice, isReversed)
        const { base: baseDescriptor, quote: quoteDescriptor } = getDisplayPair({
          tokenA: tokenADescriptor,
          tokenB: tokenBDescriptor,
          isReversed,
        })
        return (
          <ChartHeader
            value={
              <Flex gap="$spacing4">
                <Text variant="heading3">
                  <Flex row gap="$spacing4">
                    {`1 ${baseDescriptor} =`}{' '}
                    <SubscriptZeroPrice
                      variant="heading3"
                      value={displayPrice}
                      subscriptThreshold={6}
                      symbol={quoteDescriptor}
                    />
                  </Flex>
                </Text>
              </Flex>
            }
          />
        )
      }}
    </Chart>
  )
}
