import { ChartTooltip } from 'components/Charts/ChartTooltip'
import { CustomHoverMarker } from 'components/Charts/CustomHoverMarker'
import { useApplyChartTextureEffects } from 'components/Charts/hooks/useApplyChartTextureEffects'
import { ChartModelWithLiveDot, LiveDotRenderer } from 'components/Charts/LiveDotRenderer'
import { StaleBanner } from 'components/Charts/StaleBanner'
import { PROTOCOL_LEGEND_ELEMENT_ID, SeriesDataItemType } from 'components/Charts/types'
import { formatTickMarks } from 'components/Charts/utils'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import {
  BarPrice,
  CrosshairMode,
  createChart,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineStyle,
  Logical,
  TimeChartOptions,
} from 'lightweight-charts'
import { ReactElement, TouchEvent, useEffect, useMemo, useRef, useState } from 'react'
import { assertWebElement, ColorTokens, Flex, TamaguiElement, useMedia, useSporeColors } from 'ui/src'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { v4 as uuidv4 } from 'uuid'

export const refitChartContentAtom = atom<(() => void) | undefined>(undefined)

export const DEFAULT_TOP_PRICE_SCALE_MARGIN = 0.32
export const DEFAULT_BOTTOM_PRICE_SCALE_MARGIN = 0.15

interface ChartUtilParams<TDataType extends SeriesDataItemType> {
  locale: string
  colors: ReturnType<typeof useSporeColors>
  format: ReturnType<typeof useLocalizationContext>
  isLargeScreen: boolean
  onCrosshairMove?: (data: TDataType | undefined) => void
}

interface ChartDataParams<TDataType extends SeriesDataItemType> {
  color?: ColorTokens
  data: TDataType[]
  /** Repesents whether `data` is stale. If true, stale UI will appear */
  stale?: boolean
  hideTooltipBorder?: boolean
  tokenFormatType?: NumberType
}

export type ChartModelParams<TDataType extends SeriesDataItemType> = ChartUtilParams<TDataType> &
  ChartDataParams<TDataType>

type ChartTooltipBodyComponent<TDataType extends SeriesDataItemType> = React.FunctionComponent<{
  data: TDataType
}>

export type ChartHoverData<TDataType extends SeriesDataItemType> = {
  item: TDataType
  x: number
  y: number
  logicalIndex: Logical
}

/** Util for managing lightweight-charts' state outside of the React Lifecycle. */
export abstract class ChartModel<TDataType extends SeriesDataItemType> {
  protected api: IChartApi
  protected abstract series: ISeriesApi<any>
  protected data: TDataType[]
  protected chartDiv: HTMLDivElement
  protected onCrosshairMove?: (data: TDataType | undefined, index: number | undefined) => void
  private _hoverData?: ChartHoverData<TDataType> | undefined
  private _lastTooltipWidth: number | null = null

  public tooltipId = `chart-tooltip-${uuidv4()}`

  /** Get current hover coordinates for custom marker rendering */
  public getHoverCoordinates(): { x: number; y: number } | null {
    if (!this._hoverData) {
      return null
    }
    // Adjust x coordinate to account for price scale width
    return {
      x: this._hoverData.x + this.api.priceScale('left').width(),
      y: this._hoverData.y,
    }
  }

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType>) {
    this.chartDiv = chartDiv
    this.onCrosshairMove = params.onCrosshairMove
    this.data = params.data

    this.api = createChart(chartDiv)

    this.api.subscribeCrosshairMove((param) => {
      let newHoverData: ChartHoverData<TDataType> | undefined
      const logical = param.logical
      const x = param.point?.x
      const y = param.point?.y

      if (
        x !== undefined &&
        isBetween(x, 0, this.chartDiv.clientWidth) &&
        y !== undefined &&
        isBetween(y, 0, this.chartDiv.clientHeight) &&
        logical !== undefined
      ) {
        const item = param.seriesData.get(this.series) as TDataType | undefined
        if (item) {
          newHoverData = { item, x, y, logicalIndex: logical }
        }
      }

      const prevHoverData = this._hoverData
      if (
        newHoverData?.item.time !== prevHoverData?.item.time ||
        newHoverData?.logicalIndex !== prevHoverData?.logicalIndex ||
        newHoverData?.x !== prevHoverData?.x ||
        newHoverData?.y !== prevHoverData?.y
      ) {
        this._hoverData = newHoverData
        // Dynamically accesses this.onCrosshairMove rather than params.onCrosshairMove so we only ever have to make one subscribeCrosshairMove call
        this.onSeriesHover(newHoverData)
      }
    })
  }

  /**
   * Updates React state with the current crosshair data.
   * This method should be overridden in subclasses to provide specific hover functionality.
   * When overriding, call `super.onSeriesHover(data)` to maintain base functionality.
   */
  protected onSeriesHover(hoverData?: ChartHoverData<TDataType>) {
    this.onCrosshairMove?.(hoverData?.item, hoverData?.logicalIndex)

    if (!hoverData) {
      return
    }

    // Tooltip positioning modified from https://github.com/tradingview/lightweight-charts/blob/master/plugin-examples/src/plugins/tooltip/tooltip.ts
    const x = hoverData.x + this.api.priceScale('left').width() + 10
    const deadzoneWidth = this._lastTooltipWidth ? Math.ceil(this._lastTooltipWidth) : 45
    const xAdjusted = Math.min(x, this.api.paneSize().width - deadzoneWidth)

    const transformX = `calc(${xAdjusted}px)`

    const y = hoverData.y
    const flip = y <= 20 + 100
    // Add extra offset when in upper left to prevent cursor overlap
    const extraOffset = y < 50 && hoverData.x < 100 ? 10 : 0
    const yPx = y + (flip ? 1 : -1) * (20 + extraOffset)
    const yPct = flip ? '' : ' - 100%'
    const transformY = `calc(${yPx}px${yPct})`

    const tooltip = document.getElementById(this.tooltipId)
    const legend = document.getElementById(PROTOCOL_LEGEND_ELEMENT_ID)

    if (tooltip) {
      tooltip.style.transform = `translate(${transformX}, ${transformY})`

      const tooltipMeasurement = tooltip.getBoundingClientRect()
      this._lastTooltipWidth = tooltipMeasurement.width || null
    }
    if (legend) {
      // keep legend centered on mouse cursor if hovered
      legend.style.left = `${x}px`
      const heroWidth = 230
      // adjust height of tooltip if hovering below the hero text
      if (x < heroWidth) {
        legend.style.top = '80px'
      } else {
        legend.style.top = 'unset'
      }
      const transformOffset = 60
      const maxXOffset = this.api.paneSize().width - 40
      // keeps the legend centered on mouse x axis without getting cut off by chart edges
      if (x < transformOffset) {
        // Additional 4px of padding is added to prevent box-shadow from being cutoff
        legend.style.transform = `translateX(-${x - 4}%)`
      } else if (x > maxXOffset) {
        legend.style.transform = `translateX(-${transformOffset + (x - maxXOffset)}%)`
      } else {
        legend.style.transform = `translateX(-${transformOffset}%)`
      }
    }
  }

  /** Updates the chart without re-creating it or resetting pan/zoom. */
  public updateOptions(
    { locale, colors, format, isLargeScreen, onCrosshairMove }: ChartModelParams<TDataType>,
    nonDefaultChartOptions?: DeepPartial<TimeChartOptions>,
  ) {
    this.onCrosshairMove = onCrosshairMove

    // Below are default options that will apply to all Chart models that extend this class and call super.updateOptions().
    // Subclasses can override / extend these options by passing in nonDefaultChartOptions.
    const defaultOptions: DeepPartial<TimeChartOptions> = {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => format.convertFiatAmountFormatted(price, NumberType.FiatTokenPrice),
      },
      autoSize: true,
      layout: { textColor: colors.neutral2.val, background: { color: 'transparent' } },
      timeScale: {
        tickMarkFormatter: formatTickMarks,
        borderVisible: false,
        ticksVisible: false,
        timeVisible: true,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      rightPriceScale: {
        visible: isLargeScreen,
        borderVisible: false,
        scaleMargins: {
          top: DEFAULT_TOP_PRICE_SCALE_MARGIN,
          bottom: DEFAULT_BOTTOM_PRICE_SCALE_MARGIN,
        },
        autoScale: true,
      },
      grid: {
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      crosshair: {
        horzLine: {
          visible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.surface3.val,
          labelVisible: false,
        },
        mode: CrosshairMode.Magnet,
        vertLine: {
          visible: true,
          style: LineStyle.Solid,
          width: 1,
          color: colors.surface3.val,
          labelVisible: false,
        },
      },
      // Enable scrolling vertically when onTouchMove is enabled on mobile devices (when chart is not focused)
      handleScroll: {
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
    }

    this.api.applyOptions({ ...defaultOptions, ...nonDefaultChartOptions })
  }

  /** Updates visible range to fit all data from all series. */
  public fitContent() {
    this.api.timeScale().fitContent()
  }

  /** Removes the injected canvas from the chartDiv. */
  public remove() {
    this.api.remove()
  }
}

// eslint-disable-next-line max-params
function isBetween(num: number, lower: number, upper: number): boolean {
  return num > lower && num < upper
}

/** Returns a div injected with a lightweight-chart, corresponding to the given Model and params */
export function Chart<TParamType extends ChartDataParams<TDataType>, TDataType extends SeriesDataItemType>({
  Model,
  TooltipBody,
  params,
  height,
  children,
  className,
  disableChartTouchPanning,
  showDottedBackground = false,
  showLeftFadeOverlay = false,
  showCustomHoverMarker = false,
  overrideColor,
}: {
  Model: new (chartDiv: HTMLDivElement, params: TParamType & ChartUtilParams<TDataType>) => ChartModel<TDataType>
  TooltipBody?: ChartTooltipBodyComponent<TDataType>
  params: TParamType
  height?: number
  children?: (crosshair?: TDataType) => ReactElement
  className?: string
  disableChartTouchPanning?: boolean // On touch devices, optionally disables chart touch panning on mobile devices to avoid interfering with vertical scrolling
  showDottedBackground?: boolean
  showLeftFadeOverlay?: boolean
  showCustomHoverMarker?: boolean
  overrideColor?: string // Optional token color override for accent1
}) {
  const setRefitChartContent = useUpdateAtom(refitChartContentAtom)
  // Lightweight-charts injects a canvas into the page through the div referenced below
  // It is stored in state to cause a re-render upon div mount, avoiding delay in chart creation
  const [chartDivElement, setChartDivElement] = useState<TamaguiElement | null>(null)
  const [crosshairData, setCrosshairData] = useState<TDataType | undefined>(undefined)
  const [hoverCoordinates, setHoverCoordinates] = useState<{ x: number; y: number } | null>(null)
  const format = useLocalizationContext()
  const sporeColors = useSporeColors()
  const locale = useCurrentLocale()
  const media = useMedia()
  const isLargeScreen = !media.lg

  const handleCrosshairMove = useMemo(
    () => (data: TDataType | undefined) => {
      setCrosshairData(data)
      if (chartModelRef.current) {
        const coords = chartModelRef.current.getHoverCoordinates()
        setHoverCoordinates(coords)
      } else {
        setHoverCoordinates(null)
      }
    },
    [],
  )

  const colors = useMemo(() => {
    const accent1Overrides = overrideColor
      ? { val: overrideColor as ColorTokens, get: () => overrideColor as ColorTokens }
      : {}

    return {
      ...sporeColors,
      accent1: {
        ...sporeColors.accent1,
        ...accent1Overrides,
      },
    }
  }, [sporeColors, overrideColor])

  const modelParams = useMemo(
    () => ({ ...params, format, colors, locale, isLargeScreen, onCrosshairMove: handleCrosshairMove }),
    [format, isLargeScreen, locale, params, colors, handleCrosshairMove],
  )

  // Create a stable key that changes when chart data changes (e.g., time period change)
  const dataKey = useMemo(() => {
    if (params.data.length === 0) {
      return undefined
    }
    const lastItem = params.data[params.data.length - 1]
    return JSON.stringify(lastItem)
  }, [params.data])

  // Chart model state should not affect React render cycles since the chart canvas is drawn outside of React, so we store via ref
  const chartModelRef = useRef<ChartModel<TDataType>>(undefined)
  // Track when chart model is ready to trigger re-render for LiveDotRenderer
  const [isChartModelReady, setIsChartModelReady] = useState(false)

  useApplyChartTextureEffects({ chartDivElement, showDottedBackground, showLeftFadeOverlay })

  // Creates the chart as soon as the chart div ref is defined
  useEffect(() => {
    if (chartDivElement && chartModelRef.current === undefined) {
      assertWebElement(chartDivElement)
      chartModelRef.current = new Model(chartDivElement, modelParams)
      // Providers the time period selector with a handle to refit the chart
      setRefitChartContent(() => () => chartModelRef.current?.fitContent())
      // Trigger re-render so LiveDotRenderer can access the chart model
      setIsChartModelReady(true)
    }
  }, [Model, chartDivElement, modelParams, setRefitChartContent])

  // Keeps the chart up-to-date with latest data/params, without re-creating the entire chart
  useEffect(() => {
    chartModelRef.current?.updateOptions(modelParams)
  }, [modelParams])

  // Handles chart removal on unmount
  useEffect(() => {
    return () => {
      chartModelRef.current?.remove()
      // This ref's value will persist when being initially remounted in React.StrictMode.
      // The persisted IChartApi would err if utilized after calling remove(), so we manually clear the ref here.
      chartModelRef.current = undefined
      setIsChartModelReady(false)
      setRefitChartContent(undefined)
    }
  }, [setRefitChartContent])

  useOnClickOutside({
    node: { current: chartDivElement } as React.RefObject<HTMLDivElement | null>,
    handler: () => {
      setCrosshairData(undefined)
      setHoverCoordinates(null)
    },
  })

  // Update hover coordinates on crosshair data changes
  useEffect(() => {
    if (chartModelRef.current) {
      const coords = chartModelRef.current.getHoverCoordinates()
      setHoverCoordinates(coords)
    } else if (!crosshairData) {
      setHoverCoordinates(null)
    }
  }, [crosshairData])

  const touchMoveHandler = disableChartTouchPanning ? (e: TouchEvent<HTMLElement>) => e.stopPropagation() : undefined
  return (
    <Flex
      width="100%"
      position="relative"
      animation="fast"
      height={height}
      className={className}
      onTouchMove={touchMoveHandler as any} // any is used to avoid needing to import GestureResponderEvent from react-native
    >
      {/* Chart container */}
      <Flex ref={setChartDivElement} height={height} width="100%" position="relative">
        {/* Canvas is injected here by lightweight-charts */}
        {/* Background texture and fade overlay are applied directly to the chart td element */}
      </Flex>

      {/* Header/content outside background */}
      {children && children(crosshairData)}
      {TooltipBody && crosshairData && (
        <ChartTooltip id={chartModelRef.current?.tooltipId} includeBorder={!params.hideTooltipBorder}>
          <TooltipBody data={crosshairData} />
        </ChartTooltip>
      )}
      {params.stale && <StaleBanner />}
      {/* Custom hover marker */}
      {showCustomHoverMarker && hoverCoordinates && chartDivElement && chartModelRef.current && (
        <CustomHoverMarker coordinates={hoverCoordinates} lineColor={colors.accent1.val} />
      )}
      {/* Live dot indicator at the end of line charts */}
      {chartDivElement && isChartModelReady && chartModelRef.current && (
        <LiveDotRenderer
          chartModel={chartModelRef.current as ChartModelWithLiveDot}
          isHovering={!!crosshairData}
          chartContainer={chartDivElement as HTMLDivElement}
          overrideColor={overrideColor}
          dataKey={dataKey}
        />
      )}
    </Flex>
  )
}
