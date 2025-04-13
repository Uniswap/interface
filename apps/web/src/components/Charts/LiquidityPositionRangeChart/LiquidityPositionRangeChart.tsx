import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { FeeAmount } from '@uniswap/v3-sdk'
import { ActiveLiquidityChart } from 'components/Charts/ActiveLiquidityChart/ActiveLiquidityChart'
import { BandsIndicator } from 'components/Charts/BandsIndicator/bands-indicator'
import { cloneReadonly } from 'components/Charts/BandsIndicator/helpers/simple-clone'
import {
  Chart,
  ChartModel,
  ChartModelParams,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from 'components/Charts/ChartModel'
import { useDensityChartData } from 'components/Charts/LiquidityRangeInput/hooks'
import { PriceChartData } from 'components/Charts/PriceChart'
import { PriceChartType, formatTickMarks } from 'components/Charts/utils'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { ZERO_ADDRESS } from 'constants/misc'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { useTheme } from 'lib/styled-components'
import { CrosshairMode, ISeriesApi, LineStyle, LineType, UTCTimestamp } from 'lightweight-charts'
import { CreatePositionInfo, PriceRangeInfo } from 'pages/Pool/Positions/create/types'
import {
  getCurrencyAddressWithWrap,
  getPoolIdOrAddressFromCreatePositionInfo,
  getSortedCurrenciesTupleWithWrap,
} from 'pages/Pool/Positions/create/utils'
import { useMemo, useState } from 'react'
import { opacify } from 'theme/utils'
import { Flex, FlexProps, Shine, useSporeColors } from 'ui/src'
import { HorizontalDensityChart } from 'ui/src/components/icons/HorizontalDensityChart'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { zIndexes } from 'ui/src/theme/zIndexes'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import useResizeObserver from 'use-resize-observer'
// Not using the formatters in a react context, so we need to import the formatter directly.
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { formatNumber } from 'utilities/src/format/localeBased'
import { isMobileWeb } from 'utilities/src/platform'

export const CHART_HEIGHT = 52
export const CHART_WIDTH = 224
const X_AXIS_HEIGHT = 28
const Y_AXIS_WIDTH = 40
const LIQUIDITY_BARS_WIDTH = 120

const pulseKeyframe = `
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(5);
      opacity: 0;
    }
  }
`

function getCrosshairProps(
  color: any,
  { yCoordinate, xCoordinate }: { yCoordinate: number; xCoordinate: number },
): FlexProps {
  return {
    position: 'absolute',
    left: xCoordinate - 3,
    top: yCoordinate - 3, // Center the crosshair vertically on the price line.
    width: 6,
    height: 6,
    borderRadius: '$roundedFull',
    backgroundColor: color,
  }
}

function isEffectivelyInfinity(value: number): boolean {
  return Math.abs(value) >= 1e20 || Math.abs(value) <= 1e-20
}

function priceToNumber(price?: Price<Currency, Currency>): number {
  const baseCurrency = price?.baseCurrency
  if (!baseCurrency) {
    return 0
  }
  return Number(
    price
      ?.quote(CurrencyAmount.fromRawAmount(baseCurrency, Math.pow(10, baseCurrency.decimals)))
      ?.toSignificant(baseCurrency.decimals ?? 6) ?? 0,
  )
}

interface LPPriceChartModelParams extends ChartModelParams<PriceChartData> {
  type: PriceChartType.LINE
  // Optional, used to calculate the color of the price line.
  positionStatus?: PositionStatus
  // If defined these will be used to draw a range band on the chart.
  positionPriceLower?: Price<Currency, Currency> | number
  positionPriceUpper?: Price<Currency, Currency> | number
  // These callbacks provide information to the parent component.
  setCrosshairCoordinates?: ({ x, y }: { x: number; y: number }) => void
  setBoundaryPrices?: (price: [number, number]) => void
  // Color of the price data line,
  color?: string
  // Color of the current price dotted line.
  currentPriceLineColor?: string
  // Total height of the chart, including the time axis pane if showXAxis is true.
  height: number
  showXAxis?: boolean
  // Controls the vertical margins of the price scale. Defaults are define in ChartModel.
  priceScaleMargins?: {
    top: number
    bottom: number
  }
  minVisiblePrice?: number
  maxVisiblePrice?: number
  disableExtendedTimeScale?: boolean
}

export class LPPriceChartModel extends ChartModel<PriceChartData> {
  protected series: ISeriesApi<'Area'>
  private rangeBandSeries?: ISeriesApi<'Line'>
  private extendedData?: PriceChartData[]
  private positionRangeMin!: number
  private positionRangeMax!: number
  private bandIndicator?: BandsIndicator

  constructor(chartDiv: HTMLDivElement, params: LPPriceChartModelParams) {
    super(chartDiv, params)

    // Price history (primary series)
    this.series = this.api.addAreaSeries()
    this.series.setData(this.data)

    this.extendedData = LPPriceChartModel.generateExtendedData(this.data, params.disableExtendedTimeScale)
    this.rangeBandSeries = this.api.addLineSeries({ priceScaleId: 'right' })
    // The price values in the data are ignored by this Series,
    // it only uses the time values to make the BandsIndicator work.
    this.rangeBandSeries.setData(this.extendedData)
    this.rangeBandSeries.applyOptions({
      priceLineVisible: false,
      color: 'transparent',
    })

    this.calculatePositionRange(params)

    this.updateOptions(params)
    this.fitContent()
    this.overrideCrosshair(params)
  }

  updateOptions(params: LPPriceChartModelParams): void {
    // Handle changes in data
    if (this.data !== params.data) {
      this.data = params.data
      this.series.setData(this.data)
      this.extendedData = LPPriceChartModel.generateExtendedData(this.data, params.disableExtendedTimeScale)
      this.calculatePositionRange(params)
      this.rangeBandSeries?.setData(this.extendedData)
      this.fitContent()
      this.overrideCrosshair(params)
    }

    super.updateOptions(params, {
      rightPriceScale: {
        visible: false,
        autoScale: true,
        borderVisible: false,
        minimumWidth: Y_AXIS_WIDTH,
        alignLabels: true,
      },
      leftPriceScale: {
        visible: false,
      },
      timeScale: {
        visible: params.showXAxis ?? false,
        borderVisible: false,
        tickMarkFormatter: formatTickMarks,
      },
      handleScroll: false,
      handleScale: false,
      localization: {
        priceFormatter: (priceValue: number) => {
          const currentLocale = window.navigator.languages[0]
          const formatted = formatNumber({ input: priceValue, locale: currentLocale })
          return formatted
        },
      },
      crosshair: {
        mode: CrosshairMode.Hidden,
        vertLine: {
          color: 'transparent',
        },
        horzLine: {
          color: 'transparent',
        },
      },
    })

    const autoscaleInfoProvider = (original: () => any) => {
      const res = original()
      if (params.minVisiblePrice && params.maxVisiblePrice) {
        return {
          ...res,
          priceRange: {
            minValue: params.minVisiblePrice,
            maxValue: params.maxVisiblePrice,
          },
        }
      }
      return res
    }

    // Re-set options that depend on data.
    const priceLineColor = LPPriceChartModel.getPriceLineColor(params)
    this.series.applyOptions({
      priceLineVisible: true,
      priceLineStyle: LineStyle.SparseDotted,
      priceLineColor: params.currentPriceLineColor ?? priceLineColor,
      lineType: this.data.length < 20 ? LineType.WithSteps : LineType.Curved,
      lineWidth: 2,
      lineColor: priceLineColor,
      topColor: 'transparent',
      bottomColor: 'transparent',
      autoscaleInfoProvider,
    })

    this.series.priceScale().applyOptions({
      scaleMargins: params.priceScaleMargins ?? {
        top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
        bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
      },
    })
    this.rangeBandSeries?.applyOptions({
      autoscaleInfoProvider,
    })

    // Report the min/max price ticks of this chart to the parent
    requestAnimationFrame(() => {
      if (params.setBoundaryPrices) {
        const maxPrice = this.series.coordinateToPrice(0)
        const minPrice = this.series.coordinateToPrice(params.height)
        params.setBoundaryPrices([minPrice as number, maxPrice as number])
      }
    })
  }

  public static getPriceLineColor(params: Pick<LPPriceChartModelParams, 'color' | 'positionStatus' | 'theme'>): string {
    if (params.color) {
      return params.color
    }
    switch (params.positionStatus) {
      case PositionStatus.OUT_OF_RANGE:
        return params.theme.critical
      case PositionStatus.IN_RANGE:
        return params.theme.success
      case PositionStatus.CLOSED:
      default:
        return params.theme.neutral2
    }
  }

  private calculatePositionRange(params: LPPriceChartModelParams): void {
    this.positionRangeMin =
      typeof params.positionPriceLower === 'number'
        ? params.positionPriceLower
        : priceToNumber(params.positionPriceLower)
    this.positionRangeMax =
      typeof params.positionPriceUpper === 'number'
        ? params.positionPriceUpper
        : priceToNumber(params.positionPriceUpper)

    if (isEffectivelyInfinity(this.positionRangeMin)) {
      this.positionRangeMin = 0
    }
    if (isEffectivelyInfinity(this.positionRangeMax)) {
      this.positionRangeMax = Number.MAX_SAFE_INTEGER
    }

    if (params.positionPriceLower !== undefined && params.positionPriceUpper !== undefined) {
      if (!this.bandIndicator) {
        this.bandIndicator = new BandsIndicator({
          lineColor: opacify(10, params.theme.neutral1),
          fillColor: params.theme.surface3,
          lineWidth: 1,
          upperValue: this.positionRangeMax,
          lowerValue: this.positionRangeMin,
        })
        this.rangeBandSeries?.attachPrimitive(this.bandIndicator)
      } else {
        this.bandIndicator.updateOptions({
          lineColor: opacify(10, params.theme.neutral1),
          fillColor: params.theme.surface3,
          lineWidth: 1,
          upperValue: this.positionRangeMax,
          lowerValue: this.positionRangeMin,
        })
        this.bandIndicator.updateAllViews()
      }
    }
  }

  private overrideCrosshair(params: LPPriceChartModelParams): void {
    const lastDataPoint = this.data[this.data.length - 1]
    if (!lastDataPoint) {
      return
    }

    requestAnimationFrame(() => {
      const xCoordinate = this.api.timeScale().timeToCoordinate(lastDataPoint.time)
      const yCoordinate = this.series.priceToCoordinate(lastDataPoint.value)
      params.setCrosshairCoordinates?.({ x: Number(xCoordinate), y: Number(yCoordinate) })
    })
  }

  private static generateExtendedData(
    data: PriceChartData[],
    disableExtendedTimeScale: boolean = false,
  ): PriceChartData[] {
    if (disableExtendedTimeScale) {
      return data
    }
    const lastTime = data[data.length - 1]?.time
    if (!lastTime) {
      return data
    }
    const timeDelta = lastTime - data[0]?.time
    const timeIncrement = timeDelta / data.length

    if (timeIncrement === 0) {
      return data
    }

    const newData = cloneReadonly(data)
    const lastData = newData[newData.length - 1]

    for (let i = 1; i <= Math.floor(data.length / 10); i++) {
      const time = lastTime + timeIncrement * i
      newData.push({
        ...lastData,
        time: time as UTCTimestamp,
      })
    }
    return newData
  }
}

interface LiquidityPositionRangeChartProps {
  version: ProtocolVersion
  poolAddressOrId?: string
  chainId: UniverseChainId
  currency0: Currency
  currency1: Currency
  positionStatus?: PositionStatus
  // Note: this should be representative of the ordering/prices you want to display.
  // e.g. if the callsite supports inverting the prices, you should switch and invert the prices before passing them here.
  priceOrdering: {
    base?: Currency
    priceLower?: Price<Currency, Currency>
    priceUpper?: Price<Currency, Currency>
  }
  width?: number | string
  height?: number
  duration?: HistoryDuration
  showXAxis?: boolean
  showYAxis?: boolean
  interactive?: boolean
  tickSpacing?: number
  feeTier?: string | FeeAmount
  hook?: string
  showLiquidityBars?: boolean
  crosshairEnabled?: boolean
}

export function getLiquidityRangeChartProps({
  positionInfo,
  priceRangeInfo,
  interactive,
}: {
  positionInfo: CreatePositionInfo
  priceRangeInfo: PriceRangeInfo
  interactive?: boolean
}): LiquidityPositionRangeChartProps | undefined {
  const { currencies, protocolVersion } = positionInfo

  if (!currencies || !currencies[1] || !currencies[0]?.chainId) {
    return undefined
  }

  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(currencies[0], currencies[1], protocolVersion)

  const poolAddressOrId = getPoolIdOrAddressFromCreatePositionInfo(positionInfo)
  const priceOrdering =
    priceRangeInfo.protocolVersion === ProtocolVersion.V2
      ? {}
      : {
          base: sortedCurrencies[0],
          priceLower: priceRangeInfo.prices[0],
          priceUpper: priceRangeInfo.prices[1],
        }

  return {
    poolAddressOrId,
    version: protocolVersion,
    currency0: currencies[0],
    currency1: currencies[1],
    chainId: currencies[0].chainId,
    priceOrdering,
    positionStatus:
      priceRangeInfo.protocolVersion !== ProtocolVersion.V2 && priceRangeInfo.outOfRange
        ? PositionStatus.OUT_OF_RANGE
        : PositionStatus.IN_RANGE,
    interactive,
  }
}

export function LiquidityPositionRangeChartLoader({
  width,
  height,
  ...rest
}: { width: number; height: number } & FlexProps) {
  return (
    <Shine
      height={height}
      width={width}
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      alignItems="center"
      justifyContent="center"
      {...rest}
    >
      <LoadingPriceCurve size={{ width, height }} color="$neutral2" />
    </Shine>
  )
}

export function LiquidityPositionRangeChart({
  version,
  currency0,
  currency1,
  poolAddressOrId,
  chainId,
  positionStatus,
  priceOrdering,
  duration,
  width = CHART_WIDTH,
  height = CHART_HEIGHT,
  showXAxis,
  showYAxis = false,
  interactive,
  tickSpacing,
  hook,
  feeTier,
  showLiquidityBars,
  crosshairEnabled,
}: LiquidityPositionRangeChartProps) {
  const theme = useTheme()
  const isV2 = version === ProtocolVersion.V2
  const isV3 = version === ProtocolVersion.V3
  const isV4 = version === ProtocolVersion.V4
  const chainInfo = getChainInfo(chainId)
  const variables = poolAddressOrId
    ? {
        addressOrId: poolAddressOrId,
        chain: chainInfo.backendChain.chain,
        duration: duration ?? HistoryDuration.Month,
        isV4,
        isV3,
        isV2,
      }
    : undefined
  const sortedCurrencies = useMemo(
    () => getSortedCurrenciesTupleWithWrap(currency0, currency1, version),
    [currency0, currency1, version],
  )
  const priceData = usePoolPriceChartData(
    variables,
    currency0,
    currency1,
    version,
    getCurrencyAddressWithWrap(sortedCurrencies[0], version),
  )

  const [crosshairCoordinates, setCrosshairCoordinates] = useState<{ x: number; y: number }>()
  const [boundaryPrices, setBoundaryPrices] = useState<[number, number]>()

  const chartParams = useMemo(() => {
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      color: LPPriceChartModel.getPriceLineColor({ positionStatus, theme }),
      positionPriceLower: isV2 ? 0 : priceOrdering.priceLower,
      positionPriceUpper: isV2 ? Number.MAX_SAFE_INTEGER : priceOrdering.priceUpper,
      height: showLiquidityBars ? height - X_AXIS_HEIGHT : height,
      setCrosshairCoordinates,
      setBoundaryPrices,
      showXAxis,
      showYAxis,
      interactive,
      theme,
    } as const
  }, [
    priceOrdering.priceLower,
    priceOrdering.priceUpper,
    priceData.entries,
    priceData.dataQuality,
    positionStatus,
    theme,
    isV2,
    height,
    showLiquidityBars,
    showXAxis,
    showYAxis,
    interactive,
  ])

  const { formattedData, isLoading: liquidityDataLoading } = useDensityChartData({
    poolId: poolAddressOrId,
    currencyA: sortedCurrencies[0],
    currencyB: sortedCurrencies[1],
    invertPrices: currency0.equals(sortedCurrencies[0]),
    version,
    feeAmount: Number(feeTier),
    tickSpacing,
    hooks: hook ?? ZERO_ADDRESS,
    skip: !showLiquidityBars,
  })

  const sortedFormattedData = useMemo(() => {
    if (!formattedData) {
      return undefined
    }
    const uniqueTicksMap = new Map()
    formattedData.forEach((entry) => {
      uniqueTicksMap.set(entry.tick, entry)
    })

    // Convert Map values back to array and sort
    return Array.from(uniqueTicksMap.values()).sort((a, b) => a.price0 - b.price0)
  }, [formattedData])

  const loading = liquidityDataLoading && priceData.loading && priceData.entries.length === 0
  const dataUnavailable = priceData.entries.length === 0 && !liquidityDataLoading && !priceData.loading

  const colors = useSporeColors()
  const { ref: frameRef, width: chartWidth } = useResizeObserver<HTMLElement>()
  const hasChartWidth = !!chartWidth
  const shouldRenderChart = !dataUnavailable && hasChartWidth
  const shouldRenderCrosshair =
    crosshairEnabled &&
    shouldRenderChart &&
    !priceData.loading &&
    crosshairCoordinates?.y &&
    crosshairCoordinates.y > 5 &&
    crosshairCoordinates.x

  return (
    <Flex ref={frameRef} height={height} width={width} $md={{ width: '100%' }} overflow="hidden" position="relative">
      {loading && chartWidth && !dataUnavailable && (
        <LiquidityPositionRangeChartLoader
          width={chartWidth - (showLiquidityBars ? Y_AXIS_WIDTH : 0)}
          height={height}
        />
      )}
      {loading && (
        <LoadingPriceCurve
          size={{ width: chartWidth ?? CHART_WIDTH, height: height ?? CHART_HEIGHT }}
          color="$neutral2"
          mt="$spacing8"
          ml="$spacing4"
        />
      )}
      {shouldRenderChart && (
        <Flex
          width={showLiquidityBars ? chartWidth - Y_AXIS_WIDTH : chartWidth}
          $md={{ width: '100%' }}
          zIndex={zIndexes.default}
        >
          <Chart Model={LPPriceChartModel} params={chartParams} height={height ?? CHART_HEIGHT} />
        </Flex>
      )}
      <style>{pulseKeyframe}</style>
      {shouldRenderCrosshair && (
        <>
          <Flex
            {...getCrosshairProps(LPPriceChartModel.getPriceLineColor({ positionStatus, theme }), {
              xCoordinate: crosshairCoordinates.x,
              yCoordinate: crosshairCoordinates.y,
            })}
          />
          <Flex
            {...getCrosshairProps(LPPriceChartModel.getPriceLineColor({ positionStatus, theme }), {
              xCoordinate: crosshairCoordinates.x,
              yCoordinate: crosshairCoordinates.y,
            })}
            style={{
              animation: 'pulse 1.5s linear infinite',
            }}
          />
        </>
      )}
      {showLiquidityBars && chartWidth && sortedFormattedData && !loading && boundaryPrices && (
        <Flex
          width={chartWidth}
          height={height - X_AXIS_HEIGHT}
          position="absolute"
          left={0}
          top={0}
          zIndex={zIndexes.mask}
        >
          <ActiveLiquidityChart
            barColor={colors.surface3.val}
            data={{
              series: sortedFormattedData,
              current: priceData.entries[priceData.entries.length - 1]?.value,
              min: boundaryPrices[0],
              max: boundaryPrices[1],
            }}
            brushDomain={[priceToNumber(priceOrdering.priceLower), priceToNumber(priceOrdering.priceUpper)]}
            disableBrush={true}
            disableRightAxis={!showYAxis}
            showDiffIndicators={false}
            dimensions={{
              width: chartWidth,
              height: height - X_AXIS_HEIGHT,
              contentWidth: LIQUIDITY_BARS_WIDTH,
              axisLabelPaneWidth: Y_AXIS_WIDTH,
            }}
            onBrushDomainChange={() => {}}
            currency0={currency0}
            currency1={currency1}
            isMobile={isMobileWeb}
          />
        </Flex>
      )}
      {showLiquidityBars && loading && chartWidth && (
        <Shine
          position="absolute"
          right={Y_AXIS_WIDTH}
          top={0}
          alignItems="flex-end"
          height={height - X_AXIS_HEIGHT}
          width={chartWidth - Y_AXIS_WIDTH}
        >
          <HorizontalDensityChart color="$neutral2" size={height - X_AXIS_HEIGHT} />
        </Shine>
      )}
    </Flex>
  )
}
