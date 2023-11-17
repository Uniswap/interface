import { PricePoint, TimePeriod } from 'graphql/data/util'
import { useActiveLocale } from 'hooks/useActiveLocale'
import {
  createChart,
  CrosshairMode,
  HistogramData,
  LineStyle,
  TickMarkType,
  Time,
  UTCTimestamp,
} from 'lightweight-charts'
import { useEffect, useMemo, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const Tooltip = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  padding: 8px;
  gap: 4px;
  text-align: left;
  z-index: 1000;
  pointer-events: none;
`
// width: ${toolTipWidth}px;
// height: ${height};
const CrosshairLine = styled.div<{ height: number }>`
  background-color: ${({ theme }) => theme.surface3};
  height: ${({ height }) => height}px;
  position: absolute;
  display: none;

  // top: 0px;
  // box-sizing: border-box;
  z-index: 1000;
  pointer-events: none;
`

/**
 * Custom time formatter used to customize tick mark labels on the time scale.
 * Note that the returned string should be the shortest possible value and should have no more than 8 characters. Otherwise, the tick marks will overlap each other.
 * If the formatter function returns null then the default tick mark formatter will be used as a fallback.
 */
function formatTickMarks(time: UTCTimestamp, tickMarkType: TickMarkType, locale: string): string | null {
  const date = new Date(time.valueOf() * 1000)
  switch (tickMarkType) {
    case TickMarkType.Year:
      // Insert code for Year case
      return null
    case TickMarkType.Month:
      return date.toLocaleString(locale, { month: 'short', year: 'numeric' })
    case TickMarkType.DayOfMonth:
      return null
    case TickMarkType.Time:
      // Insert code for Time case
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric' })
    case TickMarkType.TimeWithSeconds:
      // Insert code for TimeWithSeconds case
      return date.toLocaleString(locale, { hour: 'numeric', minute: 'numeric', second: '2-digit' })
    default:
      return null
  }
}
type CrosshairLineStyle = {
  display: string
  left: string
  height?: string
  width: string
}
interface VolumeChartProps {
  width: number
  height: number
  prices?: PricePoint[] // TODO: use volume data when available from BE
  timePeriod: TimePeriod
  extractedColor: string
}

export function VolumeChart({ width, height, prices, timePeriod, extractedColor }: VolumeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [tooltipPrice, setTooltipPrice] = useState<string>('')
  const [toolTipDate, setTooltipDate] = useState<string>('')
  const [crosshairLineStyle, setCrosshairLineStyle] = useState<CrosshairLineStyle>({
    display: 'none',
    left: '0px',
    height: `${height}px`,
    width: '0px',
  })

  const { formatFiatPrice } = useFormatter()
  const locale = useActiveLocale()
  const { neutral2, accent1, surface3 } = useTheme()

  const data = useMemo(() => {
    if (!prices) return []
    return prices.map((price) => ({
      time: price.timestamp as UTCTimestamp,
      value: price.value,
    }))
  }, [prices])

  useEffect(() => {
    if (!chartRef.current || !prices) return

    /* Create chart */
    const chart = createChart(chartRef.current, {
      width,
      height,
      localization: {
        locale,
        // TODO: check price number localization
      },
      timeScale: {
        tickMarkFormatter: formatTickMarks,
        borderVisible: false,
        secondsVisible: true,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      layout: { textColor: neutral2, background: { color: 'transparent' } },
      grid: {
        // TODO: use our own custom dotted grid lines
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 4,
          color: surface3,
          style: LineStyle.Solid,
          labelVisible: false,
        },
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
    volumeSeries.setData(data) // can update realtime using volumeSeries.update({ time, value: 25 });
    chart.timeScale().fitContent()

    /* Create tooltip */
    const tooltipTimeFormatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }
    function setTooltipToMostRecent() {
      const lastBar = data[data.length - 1]
      const formattedPrice = formatFiatPrice({
        price: lastBar.value,
        type: NumberType.FiatTokenStats,
      })
      setTooltipPrice(formattedPrice)
      const formattedDate = new Date(lastBar.time * 1000).toLocaleString(locale, tooltipTimeFormatOptions)
      setTooltipDate(formattedDate)
    }
    setTooltipToMostRecent()

    chart.subscribeCrosshairMove((p) => {
      if (!p || !p.time || !p.point || p.point.x < 0 || p.point.x > width || p.point.y < 0 || p.point.y > height) {
        setTooltipToMostRecent()
      } else {
        const data: HistogramData<Time> | undefined = p.seriesData.get(volumeSeries) as HistogramData<Time>
        const price = data.value
        const formattedPrice = formatFiatPrice({
          price,
          type: NumberType.FiatTokenStats,
        })
        setTooltipPrice(formattedPrice)

        const formattedDate = new Date((p.time as UTCTimestamp) * 1000).toLocaleString(locale, tooltipTimeFormatOptions)
        setTooltipDate(formattedDate)
      }
      const crosshairWidth = chart.timeScale().width() / prices.length
      // let left: number = p.point.x // relative to timeScale
      // const timeScaleWidth = chart.timeScale().width()
      // const priceScaleWidth = chart.priceScale('left').width()
      // const halfTooltipWidth = crosshairWidth / 2
      // left += priceScaleWidth - halfTooltipWidth
      // left = Math.min(left, priceScaleWidth + timeScaleWidth - crosshairWidth)
      // left = Math.max(left, priceScaleWidth)

      const logical = p.logical
      if (!logical || !chart) {
        setCrosshairLineStyle({
          display: 'none',
          left: `0px`,
          width: '0px',
        })
        // setData({
        //   x: 0,
        //   visible: false,
        //   color: currentColor(),
        //   barSpacing: _barSpacing(),
        // })
        return
      }
      const coordinate = chart.timeScale().logicalToCoordinate(logical)

      setCrosshairLineStyle({
        display: 'block',
        left: `${coordinate}px`,
        width: `${crosshairWidth}px`,
      })
    })

    return () => {
      chart.remove()
    }
  }, [accent1, data, extractedColor, formatFiatPrice, height, locale, neutral2, prices, surface3, timePeriod, width])

  return (
    <div ref={chartRef}>
      <CrosshairLine style={crosshairLineStyle} height={height} />
      <Tooltip>
        <ThemedText.HeadlineLarge>{tooltipPrice}</ThemedText.HeadlineLarge>
        <ThemedText.Caption color="neutral2">{toolTipDate}</ThemedText.Caption>
      </Tooltip>
    </div>
  )
}
