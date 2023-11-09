import { PricePoint, TimePeriod } from 'graphql/data/util'
import { createChart, CrosshairMode, HistogramData, LineStyle, Time, UTCTimestamp } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'
import styled, { useTheme } from 'styled-components'
import { ThemedText } from 'theme/components'
import { NumberType, useFormatter } from 'utils/formatNumbers'

import { getTimestampFormatter, TimestampFormatterType } from '../PriceChart/format'

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

interface VolumeChartProps {
  width: number
  height: number
  prices?: PricePoint[]
  timePeriod: TimePeriod
}

export function VolumeChart({ width, height, prices, timePeriod }: VolumeChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [toolTipPrice, setTooltipPrice] = useState<string>('')
  const [toolTipDate, setTooltipDate] = useState<string>('')
  const { formatFiatPrice } = useFormatter()

  const { neutral2, accent1 } = useTheme()

  // need to create chart after mounting bc DOM element where chart will be placed needs to be available
  useEffect(() => {
    if (!chartRef.current || !prices) return
    const tickMarkFormatter = getTimestampFormatter(timePeriod, 'en', TimestampFormatterType.TICK)
    const tooltipTimeFormatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }
    const chart = createChart(chartRef.current, {
      width,
      height,
      timeScale: {
        tickMarkFormatter,
        borderVisible: false,
        ticksVisible: false,
      },
      rightPriceScale: {
        borderVisible: false,
      },
      layout: { textColor: neutral2, background: { color: 'transparent' } },
      grid: {
        // using our own custom dotted grid lines
        vertLines: {
          visible: false,
        },
        horzLines: {
          visible: false,
        },
      },
      crosshair: {
        // Change mode from default 'magnet' to 'normal'.
        // Allows the crosshair to move freely without snapping to datapoints
        mode: CrosshairMode.Normal,

        // Vertical crosshair line (showing Date in Label)
        vertLine: {
          width: 4,
          color: '#C3BCDB44',
          style: LineStyle.Solid,
          labelVisible: false,
        },
        horzLine: {
          labelVisible: false,
        },
      },
    })

    const volumeSeries = chart.addHistogramSeries({
      color: accent1,
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
    const data = prices.map((price) => ({
      time: price.timestamp as UTCTimestamp,
      value: price.value,
    }))
    volumeSeries.setData(data) // can update realtime using volumeSeries.update({ time: '2018-12-31', value: 25 });

    function setLastBarText() {
      const lastBar = data[data.length - 1]
      const formattedPrice = formatFiatPrice({
        price: lastBar.value,
        type: NumberType.FiatTokenStats,
      })
      setTooltipPrice(formattedPrice)
      const formattedDate = new Date(lastBar.time * 1000).toLocaleString(
        'en-US', // todo replace with user locale preference
        tooltipTimeFormatOptions
      )
      setTooltipDate(formattedDate)
    }
    setLastBarText()

    chart.subscribeCrosshairMove((param) => {
      if (
        param === undefined ||
        param.time === undefined ||
        param.point === undefined ||
        param.point.x < 0 ||
        param.point.x > width ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        setLastBarText()
      } else {
        const data: HistogramData<Time> | undefined = param.seriesData.get(volumeSeries) as HistogramData<Time>
        const price = data.value
        const formattedPrice = formatFiatPrice({
          price,
          type: NumberType.FiatTokenStats,
        })
        setTooltipPrice(formattedPrice)

        const formattedDate = new Date((param.time as UTCTimestamp) * 1000).toLocaleString(
          'en-US', // todo replace with user locale preference
          tooltipTimeFormatOptions
        )
        setTooltipDate(formattedDate)
      }
    })

    return () => {
      chart.remove()
    }
  }, [accent1, formatFiatPrice, height, neutral2, prices, timePeriod, width])

  return (
    <div ref={chartRef}>
      <Tooltip>
        <ThemedText.HeadlineLarge>{toolTipPrice}</ThemedText.HeadlineLarge>
        <ThemedText.Caption color="neutral2">{toolTipDate}</ThemedText.Caption>
      </Tooltip>
    </div>
  )
}
