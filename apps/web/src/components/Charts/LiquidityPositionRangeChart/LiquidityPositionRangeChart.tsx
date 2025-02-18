// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { BandsIndicator } from 'components/Charts/BandsIndicator/bands-indicator'
import { cloneReadonly } from 'components/Charts/BandsIndicator/helpers/simple-clone'
import {
  Chart,
  ChartModel,
  ChartModelParams,
  DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
  DEFAULT_TOP_PRICE_SCALE_MARGIN,
} from 'components/Charts/ChartModel'
import { PriceChartData } from 'components/Charts/PriceChart'
import { PriceChartType, formatTickMarks } from 'components/Charts/utils'
import { DataQuality } from 'components/Tokens/TokenDetails/ChartSection/util'
import { usePoolPriceChartData } from 'hooks/usePoolPriceChartData'
import { useTheme } from 'lib/styled-components'
import { CrosshairMode, ISeriesApi, LineStyle, LineType, UTCTimestamp } from 'lightweight-charts'
import { CreatePositionInfo, PriceRangeInfo } from 'pages/Pool/Positions/create/types'
import {
  getCurrencyAddressWithWrap,
  getPoolIdOrAddressFromCreatePositionInfo,
  getSortedCurrenciesTupleWithWrap,
} from 'pages/Pool/Positions/create/utils'
import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { opacify } from 'theme/utils'
import { Flex, FlexProps, Shine, TamaguiElement, assertWebElement } from 'ui/src'
import { LoadingPriceCurve } from 'ui/src/components/icons/LoadingPriceCurve'
import { HistoryDuration } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

const CHART_HEIGHT = 52
export const CHART_WIDTH = 224

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
  private positionRangeMin: number
  private positionRangeMax: number

  constructor(chartDiv: HTMLDivElement, params: LPPriceChartModelParams) {
    super(chartDiv, params)

    this.positionRangeMin =
      typeof params.positionPriceLower === 'number'
        ? params.positionPriceLower
        : Number(
            params.positionPriceLower
              ?.quote(
                CurrencyAmount.fromRawAmount(
                  params.positionPriceLower.baseCurrency,
                  Math.pow(10, params.positionPriceLower.baseCurrency.decimals),
                ),
              )
              ?.toSignificant(params.positionPriceLower.baseCurrency.decimals || 6) ?? 0,
          )
    this.positionRangeMax =
      typeof params.positionPriceUpper === 'number'
        ? params.positionPriceUpper
        : Number(
            params.positionPriceUpper
              ?.quote(
                CurrencyAmount.fromRawAmount(
                  params.positionPriceUpper.baseCurrency,
                  Math.pow(10, params.positionPriceUpper.baseCurrency.decimals),
                ),
              )
              ?.toSignificant(params.positionPriceUpper.baseCurrency.decimals || 6) ?? 0,
          )

    if (isEffectivelyInfinity(this.positionRangeMin)) {
      this.positionRangeMin = 0
    }
    if (isEffectivelyInfinity(this.positionRangeMax)) {
      this.positionRangeMax = Number.MAX_SAFE_INTEGER
    }

    // Price history (primary series)
    this.series = this.api.addAreaSeries()
    this.series.setData(this.data)

    this.extendedData = LPPriceChartModel.generateExtendedData(this.data, params.disableExtendedTimeScale)
    this.rangeBandSeries = this.api.addLineSeries()
    // The price values in the data are ignored by this Series,
    // it only uses the time values to make the BandsIndicator work.
    this.rangeBandSeries.setData(this.extendedData)
    this.rangeBandSeries.applyOptions({
      priceLineVisible: false,
      color: 'transparent',
    })

    if (params.positionPriceLower !== undefined && params.positionPriceUpper !== undefined) {
      const bandIndicator = new BandsIndicator({
        lineColor: opacify(10, params.theme.neutral1),
        fillColor: params.theme.surface3,
        lineWidth: 1,
        upperValue: this.positionRangeMax,
        lowerValue: this.positionRangeMin,
      })
      this.rangeBandSeries.attachPrimitive(bandIndicator)
    }

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
      this.rangeBandSeries?.setData(this.extendedData)
      this.fitContent()
      this.overrideCrosshair(params)
    }

    super.updateOptions(params, {
      rightPriceScale: {
        visible: false,
        autoScale: true,
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
  priceOrdering: {
    base?: Currency
    priceLower?: Price<Currency, Currency>
    priceUpper?: Price<Currency, Currency>
  }
  width?: number | string
  grow?: boolean
}

export function getLiquidityRangeChartProps({
  positionInfo,
  priceRangeInfo,
}: {
  positionInfo: CreatePositionInfo
  priceRangeInfo: PriceRangeInfo
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
  }
}

export function LiquidityPositionRangeChartLoader({ size }: { size?: number }) {
  if (!size) {
    return null
  }

  return (
    <Shine height={CHART_HEIGHT}>
      <LoadingPriceCurve size={size} color="$neutral2" />
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
  width = CHART_WIDTH,
  grow = false,
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
        duration: HistoryDuration.Month,
        isV4,
        isV3,
        isV2,
      }
    : undefined
  const sortedCurrencies = getSortedCurrenciesTupleWithWrap(currency0, currency1, version)
  const priceData = usePoolPriceChartData(
    variables,
    currency0,
    currency1,
    version,
    getCurrencyAddressWithWrap(sortedCurrencies[0], version),
  )

  const [crosshairCoordinates, setCrosshairCoordinates] = useState<{ x: number; y: number }>()

  const chartParams = useMemo(() => {
    const invertPrices = priceOrdering.base?.equals(sortedCurrencies[0])
    return {
      data: priceData.entries,
      stale: priceData.dataQuality === DataQuality.STALE,
      type: PriceChartType.LINE,
      color: LPPriceChartModel.getPriceLineColor({ positionStatus, theme }),
      positionPriceLower: isV2 ? 0 : invertPrices ? priceOrdering.priceLower?.invert() : priceOrdering.priceLower,
      positionPriceUpper: isV2
        ? Number.MAX_SAFE_INTEGER
        : invertPrices
          ? priceOrdering.priceUpper?.invert()
          : priceOrdering.priceUpper,
      height: CHART_HEIGHT,
      setCrosshairCoordinates,
    } as const
  }, [
    priceOrdering.base,
    priceOrdering.priceLower,
    priceOrdering.priceUpper,
    sortedCurrencies,
    priceData.entries,
    priceData.dataQuality,
    theme,
    isV2,
    positionStatus,
  ])

  const dataUnavailable = priceData.entries.length === 0 && !priceData.loading

  const frameRef = useRef<TamaguiElement>(null)
  const [chartWidth, setChartWidth] = useState<number | undefined>(undefined)
  const hasChartWidth = (grow && !!chartWidth) || !grow
  const shouldRenderChart = !dataUnavailable && hasChartWidth
  const shouldRenderCrosshair =
    shouldRenderChart &&
    !priceData.loading &&
    crosshairCoordinates?.y &&
    crosshairCoordinates.y > 5 &&
    crosshairCoordinates.x

  useLayoutEffect(() => {
    if (frameRef.current) {
      assertWebElement(frameRef.current)
      setChartWidth(frameRef.current.clientWidth)
    }
  }, [])

  return (
    <Flex
      grow={grow}
      ref={frameRef}
      height={CHART_HEIGHT}
      flexBasis={grow ? 1 : undefined}
      width={width}
      $md={{ width: grow ? chartWidth : '100%' }}
      overflow="hidden"
    >
      {priceData.loading && <LiquidityPositionRangeChartLoader size={chartWidth} />}
      {dataUnavailable && (
        <LoadingPriceCurve
          size={{ width: chartWidth ?? CHART_WIDTH, height: CHART_HEIGHT }}
          color="$neutral2"
          mt="$spacing8"
          ml="$spacing4"
        />
      )}
      {shouldRenderChart && (
        <Flex width={grow ? chartWidth : width} $md={{ width: grow ? chartWidth : '100%' }}>
          <Chart Model={LPPriceChartModel} params={chartParams} height={CHART_HEIGHT} />
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
    </Flex>
  )
}
