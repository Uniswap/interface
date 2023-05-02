import React, { useRef, useState, useEffect, useCallback, Dispatch, SetStateAction, ReactNode } from 'react'
import { createChart, IChartApi } from 'lightweight-charts'
import { RowBetween } from 'components/Row'
import Card from '../Card'
// import styled from 'styled-components'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
// import useTheme from 'hooks/useTheme'
import styled, { useTheme } from 'styled-components/macro'

dayjs.extend(utc)

const Wrapper = styled(Card)`
  width: 100%;
  padding: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.background}
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const DEFAULT_HEIGHT = 300

export type LineChartProps = {
  data: any[]
  color?: string | undefined
  height?: number | undefined
  minHeight?: number
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  setLabel?: Dispatch<SetStateAction<string | undefined>> // used for value label on hover
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const CandleChart = ({
  data,
  color = '#56B2A4',
  setValue,
  setLabel,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  height = DEFAULT_HEIGHT,
  minHeight = DEFAULT_HEIGHT,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()
  const textColor = theme.textTertiary
  const chartRef = useRef<HTMLDivElement>(null)
  const [chartCreated, setChart] = useState<IChartApi | undefined>()
  const [nonce, setNonce] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleResize = useCallback(() => {
    if (chartCreated && chartRef?.current?.parentElement) {
      chartCreated.resize(chartRef.current.parentElement.clientWidth - 32, height)
      chartCreated.timeScale().fitContent()
      chartCreated.timeScale().scrollToPosition(0, false)
    }
  }, [chartCreated, chartRef, height])

  // add event listener for resize
  const isClient = typeof window === 'object'
  useEffect(() => {
    if (!isClient) {
      return
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient, chartRef, handleResize]) // Empty array ensures that effect is only run on mount and unmount

  console.log("stateCandle: ", nonce, !chartCreated)

  // if chart not instantiated in canvas, create it
  useEffect(() => {
    if (!chartCreated && data.length > 0 && !!chartRef?.current?.parentElement) {
      // console.log("chartCreated: ", chartCreated, data, chartRef?.current?.parentElement)
      const chart = createChart(chartRef.current, {
        height: height,
        width: chartRef.current.parentElement.clientWidth - 32,
        layout: {
          background: {
            color: 'transparent'
          },
          textColor: '#565A69',
          fontFamily: 'Inter var',
        },
        rightPriceScale: {
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
          borderVisible: false,
        },
        timeScale: {
          borderVisible: false,
          secondsVisible: true,
          tickMarkFormatter: (unixTime: number) => {
            return dayjs.unix(unixTime).format('MM/DD h:mm A')
          },
        },
        watermark: {
          visible: false,
        },
        grid: {
          horzLines: {
            visible: false,
          },
          vertLines: {
            visible: false,
          },
        },
        crosshair: {
          horzLine: {
            visible: false,
            labelVisible: false,
          },
          mode: 1,
          vertLine: {
            visible: true,
            labelVisible: false,
            style: 3,
            width: 1,
            color: '#505050',
            labelBackgroundColor: color,
          },
        },
      })
      // console.log("chartafter: ", chartCreated, chart)
      chart.timeScale().fitContent()
      setChart(chart)
      // setChart(chart)
    }
  }, [color, chartCreated, data, height, setValue, textColor, theme])


  useEffect(() => {
    if (chartCreated && data) {
      const series = chartCreated.addCandlestickSeries({
        upColor: 'green',
        downColor: 'red',
        borderDownColor: 'red',
        borderUpColor: 'green',
        wickDownColor: 'red',
        wickUpColor: 'green',
      })

      series.setData(data)

      // update the title when hovering on the chart
      chartCreated.subscribeCrosshairMove(function (param) {
        if (
          chartRef?.current &&
          (param === undefined ||
            param.time === undefined ||
            (param && param.point && param.point.x < 0) ||
            (param && param.point && param.point.x > chartRef.current.clientWidth) ||
            (param && param.point && param.point.y < 0) ||
            (param && param.point && param.point.y > height))
        ) {
          // reset values
          setValue && setValue(undefined)
          setLabel && setLabel(undefined)
        } else if (series && param) {
          const timestamp = param.time as number
          const time = dayjs.unix(timestamp).utc().format('MMM D, YYYY h:mm A') + ' (UTC)'
          const parsed = param.seriesData.get(series) as { open: number } | undefined
          setValue && setValue(parsed?.open)
          setLabel && setLabel(time)
        }
      })
    }
  }, [chartCreated, color, data, height, setValue, setLabel, theme.background])

  return (
    <Wrapper minHeight={minHeight} padding={"10px"}>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <div ref={chartRef} id={'candle-chart'} {...rest} />
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default CandleChart