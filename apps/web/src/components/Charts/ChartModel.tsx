import { PROTOCOL_LEGEND_ELEMENT_ID, SeriesDataItemType } from 'components/Charts/types'
import { formatTickMarks } from 'components/Charts/utils'
import { MissingDataBars } from 'components/Table/icons'
import { useScreenSize } from 'hooks/screenSize/useScreenSize'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { DefaultTheme, useTheme } from 'lib/styled-components'
import {
  BarPrice,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineStyle,
  Logical,
  TimeChartOptions,
  createChart,
} from 'lightweight-charts'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import { ThemedText } from 'theme/components'
import { Flex, TamaguiElement, assertWebElement, styled } from 'ui/src'
import { Trans } from 'uniswap/src/i18n'
import { useFormatter } from 'utils/formatNumbers'
import { v4 as uuidv4 } from 'uuid'

export const refitChartContentAtom = atom<(() => void) | undefined>(undefined)

interface ChartUtilParams<TDataType extends SeriesDataItemType> {
  locale: string
  theme: DefaultTheme
  format: ReturnType<typeof useFormatter>
  isLargeScreen: boolean
  onCrosshairMove?: (data: TDataType | undefined) => void
}

interface ChartDataParams<TDataType extends SeriesDataItemType> {
  color?: string
  data: TDataType[]
  /** Repesents whether `data` is stale. If true, stale UI will appear */
  stale?: boolean
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

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType>) {
    this.chartDiv = chartDiv
    this.onCrosshairMove = params.onCrosshairMove
    this.data = params.data

    this.api = createChart(chartDiv)

    this.api.subscribeCrosshairMove((param) => {
      let newHoverData: ChartHoverData<TDataType> | undefined = undefined
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
        this.onSeriesHover?.(newHoverData)
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
    const yPx = y + (flip ? 1 : -1) * 20
    const yPct = flip ? '' : ' - 100%'
    const transformY = `calc(${yPx}px${yPct})`

    const tooltip = document.getElementById(this.tooltipId)
    const legend = document.getElementById(PROTOCOL_LEGEND_ELEMENT_ID)

    if (tooltip) {
      tooltip.style.transform = `translate(${transformX}, ${transformY})`

      const tooltipMeasurement = tooltip.getBoundingClientRect()
      this._lastTooltipWidth = tooltipMeasurement?.width || null
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
    { locale, theme, format, isLargeScreen, onCrosshairMove }: ChartModelParams<TDataType>,
    nonDefaultChartOptions?: DeepPartial<TimeChartOptions>,
  ) {
    this.onCrosshairMove = onCrosshairMove

    // Below are default options that will apply to all Chart models that extend this class and call super.updateOptions().
    // Subclasses can override / extend these options by passing in nonDefaultChartOptions.
    const defaultOptions: DeepPartial<TimeChartOptions> = {
      localization: {
        locale,
        priceFormatter: (price: BarPrice) => format.formatFiatPrice({ price }),
      },
      autoSize: true,
      layout: { textColor: theme.neutral2, background: { color: 'transparent' } },
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
          top: 0.32,
          bottom: 0.15,
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
          color: theme.surface3,
          labelVisible: false,
        },
        mode: CrosshairMode.Magnet,
        vertLine: {
          visible: true,
          style: LineStyle.Solid,
          width: 1,
          color: theme.surface3,
          labelVisible: false,
        },
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

const isBetween = (num: number, lower: number, upper: number) => num > lower && num < upper

/** Returns a div injected with a lightweight-chart, corresponding to the given Model and params */
export function Chart<TParamType extends ChartDataParams<TDataType>, TDataType extends SeriesDataItemType>({
  Model,
  TooltipBody,
  params,
  height,
  children,
  className,
}: {
  Model: new (chartDiv: HTMLDivElement, params: TParamType & ChartUtilParams<TDataType>) => ChartModel<TDataType>
  TooltipBody?: ChartTooltipBodyComponent<TDataType>
  params: TParamType
  height?: number
  children?: (crosshair?: TDataType) => ReactElement
  className?: string
}) {
  const setRefitChartContent = useUpdateAtom(refitChartContentAtom)
  // Lightweight-charts injects a canvas into the page through the div referenced below
  // It is stored in state to cause a re-render upon div mount, avoiding delay in chart creation
  const [chartDivElement, setChartDivElement] = useState<TamaguiElement | null>(null)
  const [crosshairData, setCrosshairData] = useState<TDataType | undefined>(undefined)
  const format = useFormatter()
  const theme = useTheme()
  const locale = useActiveLocale()
  const { md: isLargeScreen } = useScreenSize()
  const modelParams = useMemo(
    () => ({ ...params, format, theme, locale, isLargeScreen, onCrosshairMove: setCrosshairData }),
    [format, isLargeScreen, locale, params, theme],
  )

  // Chart model state should not affect React render cycles since the chart canvas is drawn outside of React, so we store via ref
  const chartModelRef = useRef<ChartModel<TDataType>>()

  // Creates the chart as soon as the chart div ref is defined
  useEffect(() => {
    if (chartDivElement && chartModelRef.current === undefined) {
      assertWebElement(chartDivElement)
      chartModelRef.current = new Model(chartDivElement, modelParams)
      // Providers the time period selector with a handle to refit the chart
      setRefitChartContent(() => () => chartModelRef.current?.fitContent())
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
      setRefitChartContent(undefined)
    }
  }, [setRefitChartContent])

  useOnClickOutside({ current: chartDivElement } as React.RefObject<HTMLDivElement>, () => setCrosshairData(undefined))

  return (
    <Flex
      width="100%"
      position="relative"
      animation="fast"
      ref={setChartDivElement}
      height={height}
      className={className}
      // Prevents manipulating the chart with touch so that it doesn't interfere with scrolling the page.
      onTouchMove={(e) => e.stopPropagation()}
    >
      {children && children(crosshairData)}
      {TooltipBody && crosshairData && (
        <ChartTooltip id={chartModelRef.current?.tooltipId}>
          <TooltipBody data={crosshairData} />
        </ChartTooltip>
      )}
      {params.stale && <StaleBanner />}
    </Flex>
  )
}

const ChartTooltip = styled(Flex, {
  alignItems: 'center',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: '$tooltip',
  backgroundColor: '$surface5',
  backdropFilter: 'blur(8px)',
  borderRadius: '$rounded8',
  borderColor: '$surface3',
  borderStyle: 'solid',
  borderWidth: 1,
  p: '$spacing8',
})

const StaleBannerWrapper = styled(ChartTooltip, {
  borderRadius: '$rounded16',
  left: 'unset',
  top: 'unset',
  right: '$spacing12',
  bottom: '$spacing40',
  p: '$spacing12',
  backgroundColor: '$surface4',
})

function StaleBanner() {
  const theme = useTheme()
  // TODO(WEB-3739): Update Chart UI to grayscale when data is stale
  return (
    <StaleBannerWrapper data-testid="chart-stale-banner">
      <Flex row gap="$gap8">
        <MissingDataBars color={theme.neutral1} />
        <ThemedText.BodySmall>
          <Trans i18nKey="common.dataOutdated" />
        </ThemedText.BodySmall>
      </Flex>
    </StaleBannerWrapper>
  )
}
