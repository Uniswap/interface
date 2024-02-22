import { formatTickMarks } from 'components/Charts/utils'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useUpdateAtom } from 'jotai/utils'
import {
  BarPrice,
  createChart,
  CrosshairMode,
  DeepPartial,
  IChartApi,
  ISeriesApi,
  LineStyle,
  SeriesDataItemTypeMap,
  SeriesOptionsMap,
  Time,
  TimeChartOptions,
} from 'lightweight-charts'
import { ReactElement, useEffect, useMemo, useRef, useState } from 'react'
import styled, { DefaultTheme, useTheme } from 'styled-components'
import { useFormatter } from 'utils/formatNumbers'

import { refitChartContentAtom } from './TimeSelector'

type SeriesDataItemType = SeriesDataItemTypeMap<Time>[keyof SeriesOptionsMap]

interface ChartUtilParams<TDataType extends SeriesDataItemType> {
  locale: string
  theme: DefaultTheme
  format: ReturnType<typeof useFormatter>
  onCrosshairMove?: (data: TDataType | undefined) => void
}

interface ChartDataParams<TDataType extends SeriesDataItemType> {
  color?: string
  data: TDataType[]
}

export type ChartModelParams<TDataType extends SeriesDataItemType> = ChartUtilParams<TDataType> &
  ChartDataParams<TDataType>

/** Util for managing lightweight-charts' state outside of the React Lifecycle. */
export abstract class ChartModel<TDataType extends SeriesDataItemType> {
  protected api: IChartApi
  protected abstract series: ISeriesApi<any>
  protected data: TDataType[]
  protected chartDiv: HTMLDivElement
  protected onCrosshairMove?: (data: TDataType | undefined) => void

  constructor(chartDiv: HTMLDivElement, params: ChartModelParams<TDataType>) {
    this.chartDiv = chartDiv
    this.onCrosshairMove = params.onCrosshairMove
    this.data = params.data

    this.api = createChart(chartDiv)

    this.api.subscribeCrosshairMove((param) => {
      if (
        param === undefined ||
        param.time === undefined ||
        (param && param.point && param.point.x < 0) ||
        (param && param.point && param.point.x > this.chartDiv.clientWidth) ||
        (param && param.point && param.point.y < 0) ||
        (param && param.point && param.point.y > this.chartDiv.clientHeight)
      ) {
        // reset values
        this.onCrosshairMove?.(undefined)
      } else if (param) {
        // Dynamically accesses this.onCrosshairMove rather than params.onCrosshairMove so we only ever have to make one subscribeCrosshairMove call
        this.onCrosshairMove?.(param.seriesData.get(this.series) as TDataType)
      }
    })
  }

  /** Updates the chart without re-creating it or resetting pan/zoom. */
  public updateOptions(
    { locale, theme, format, onCrosshairMove }: ChartModelParams<TDataType>,
    nonDefaultChartOptions?: DeepPartial<TimeChartOptions>
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

const ChartDiv = styled.div<{ height?: number }>`
  ${({ height }) => height && `height: ${height}px`};
  width: 100%;
  position: relative;
`

/** Returns a div injected with a lightweight-chart, corresponding to the given Model and params */
export function Chart<TParamType extends ChartDataParams<TDataType>, TDataType extends SeriesDataItemType>({
  Model,
  params,
  height,
  children,
  className,
}: {
  Model: new (chartDiv: HTMLDivElement, params: TParamType & ChartUtilParams<TDataType>) => ChartModel<TDataType>
  params: TParamType
  height?: number
  children?: (crosshair?: TDataType) => ReactElement
  className?: string
}) {
  const setRefitChartContent = useUpdateAtom(refitChartContentAtom)
  // Lightweight-charts injects a canvas into the page through the div referenced below
  // It is stored in state to cause a re-render upon div mount, avoiding delay in chart creation
  const [chartDivElement, setChartDivElement] = useState<HTMLDivElement | null>(null)
  const [crosshairData, setCrosshairData] = useState<TDataType | undefined>(undefined)
  const format = useFormatter()
  const theme = useTheme()
  const locale = useActiveLocale()
  const modelParams = useMemo(
    () => ({ ...params, format, theme, locale, onCrosshairMove: setCrosshairData }),
    [format, locale, params, theme]
  )

  // Chart model state should not affect React render cycles since the chart canvas is drawn outside of React, so we store via ref
  const chartModelRef = useRef<ChartModel<TDataType>>()

  // Creates the chart as soon as the chart div ref is defined
  if (chartDivElement && chartModelRef.current === undefined) {
    chartModelRef.current = new Model(chartDivElement, modelParams)
    // Providers the time period selector with a handle to refit the chart
    setRefitChartContent(() => () => chartModelRef.current?.fitContent())
  }

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

  return (
    <ChartDiv ref={setChartDivElement} height={height} className={className}>
      {children && children(crosshairData)}
    </ChartDiv>
  )
}
