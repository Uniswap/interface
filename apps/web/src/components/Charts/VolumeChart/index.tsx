import { refitChartContentAtom } from 'components/Tokens/TokenDetails/TimeSelector'
import { PricePoint, TimePeriod, toHistoryDuration } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useUpdateAtom } from 'jotai/utils'
import { createChart, HistogramData, LogicalRange, UTCTimestamp } from 'lightweight-charts'
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { formatTickMarks } from '../utils'
import { CrosshairHighlightPrimitive } from './CrosshairHighlightPrimitive'

const ChartContainer = styled.div<{ $height: number }>`
  width: 100%;
  height: ${({ $height }) => $height}px;
`

const ChartHeader = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  gap: 4px;
  padding-bottom: 14px;
  text-align: left;
  pointer-events: none;
`
interface VolumeChartProps {
  volumes?: PricePoint[]
  timePeriod: TimePeriod
  height: number
  extractedColor: string
}

export function VolumeChart({ volumes, timePeriod, height, extractedColor }: VolumeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const setRefitChartContent = useUpdateAtom(refitChartContentAtom)

  const chartHeaderRef = useRef<HTMLDivElement>(null)
  const [headerData, setHeaderData] = useState<{ time: string; value: string }>({ time: '-', value: '-' })

  const { formatFiatPrice } = useFormatter()
  const priceFormatter = useCallback(
    (price?: number) =>
      formatFiatPrice({
        price,
        type: NumberType.FiatTokenStatChartHeader,
      }),
    [formatFiatPrice]
  )
  const scalePriceFormatter = useCallback(
    (price: number) =>
      formatFiatPrice({
        price,
        type: NumberType.FiatTokenChartPriceScale,
      }),
    [formatFiatPrice]
  )
  const locale = useActiveLocale()
  const headerDateFormatter = useCallback(
    (time?: UTCTimestamp) => {
      if (!time) return '-'
      const headerTimeFormatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
      }
      return new Date(time * 1000).toLocaleString(locale, headerTimeFormatOptions)
    },
    [locale]
  )

  const theme = useTheme()

  const data = useMemo(() => {
    if (!volumes) return []
    return volumes.map((volume) => ({
      time: volume.timestamp as UTCTimestamp,
      value: volume.value,
    }))
  }, [volumes])
  // Mock cumulative volumes data for chart header
  const cumulativeData = useMemo(
    () => ({
      [TimePeriod.HOUR]: Math.random() * 1e3,
      [TimePeriod.DAY]: Math.random() * 1e4,
      [TimePeriod.WEEK]: Math.random() * 1e5,
      [TimePeriod.MONTH]: Math.random() * 1e6,
      [TimePeriod.YEAR]: Math.random() * 1e10,
    }),
    []
  )
  const setHeaderStatsToCumulative = useCallback(
    (timePeriod: TimePeriod) => {
      setHeaderData({
        time: `Last 1 ${toHistoryDuration(timePeriod).toLowerCase()}`,
        value: priceFormatter(cumulativeData[timePeriod]),
      })
    },
    [cumulativeData, priceFormatter]
  )

  // lightweight-charts requires an existing div to draw the chart in — hence chart creation done via ref here
  useLayoutEffect(() => {
    if (!chartRef.current) return

    /* Create chart */
    const chart = createChart(chartRef.current, {
      autoSize: true,
      localization: {
        locale,
        priceFormatter: scalePriceFormatter,
      },
      timeScale: {
        tickMarkFormatter: formatTickMarks,
        borderVisible: false,
        timeVisible: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
      },
      handleScroll: {
        vertTouchDrag: false,
      },
      layout: { textColor: theme.neutral2, background: { color: 'transparent' } },
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
          visible: false,
          labelVisible: false,
        },
      },
    })

    /* Create volume histogram */
    const volumeSeries = chart.addHistogramSeries({
      color: extractedColor,
      priceFormat: {
        type: 'volume',
      },
      priceLineVisible: false,
      lastValueVisible: false,
    })
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.3, // highest point of the series will be 30% away from the top
        bottom: 0,
      },
    })

    volumeSeries.setData(data)
    chart.timeScale().fitContent()
    // Prevent scrolling or scaling too far beyond selected time period
    chart.timeScale().subscribeVisibleLogicalRangeChange((range: LogicalRange | null) => {
      if (range) {
        const rangeWidth = range.to - range.from
        const emptyBuffer = rangeWidth / 6
        if (range.from < -emptyBuffer && range.to > data.length - 1 + emptyBuffer) {
          // Scaling out too far
          chart.timeScale().setVisibleLogicalRange({ from: -emptyBuffer, to: data.length - 1 + emptyBuffer })
        } else {
          // Scrolling out too far
          if (range.from < -emptyBuffer) {
            chart.timeScale().setVisibleLogicalRange({ from: -emptyBuffer, to: -emptyBuffer + rangeWidth })
          }
          if (range.to > data.length - 1 + emptyBuffer) {
            chart.timeScale().setVisibleLogicalRange({
              from: data.length - 1 + emptyBuffer - rangeWidth,
              to: data.length - 1 + emptyBuffer,
            })
          }
        }
      }
    })
    setRefitChartContent(() => {
      return () => chart.timeScale().fitContent()
    })

    /* Add crosshair highlight bar */
    const crosshairYPosition = chartHeaderRef?.current?.offsetHeight ?? 0
    const crosshair = new CrosshairHighlightPrimitive({
      color: theme.surface3,
      crosshairYPosition,
    })
    volumeSeries.attachPrimitive(crosshair)

    /* Create dynamic chart header */
    setHeaderStatsToCumulative(timePeriod)

    const width = chartRef.current.clientWidth
    chart.subscribeCrosshairMove((p) => {
      if (!p || !p.time || !p.point || p.point.x < 0 || p.point.x > width || p.point.y < 0 || p.point.y > height) {
        setHeaderStatsToCumulative(timePeriod)
      } else {
        const dataPoint = p.seriesData.get(volumeSeries) as HistogramData<UTCTimestamp> | undefined
        setHeaderData({ time: headerDateFormatter(dataPoint?.time), value: priceFormatter(dataPoint?.value) })
      }
    })

    return () => {
      chart.remove()
      setRefitChartContent(undefined)
    }
  }, [
    extractedColor,
    data,
    locale,
    priceFormatter,
    theme,
    setRefitChartContent,
    headerDateFormatter,
    scalePriceFormatter,
    height,
    setHeaderStatsToCumulative,
    timePeriod,
  ])

  return (
    <ChartContainer $height={height} ref={chartRef}>
      <ChartHeader ref={chartHeaderRef}>
        <ThemedText.HeadlineLarge>{headerData.value}</ThemedText.HeadlineLarge>
        <ThemedText.Caption color="neutral2">{headerData.time}</ThemedText.Caption>
      </ChartHeader>
    </ChartContainer>
  )
}
