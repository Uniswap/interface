import React, { useRef, useState, useEffect, useCallback, Dispatch, SetStateAction, ReactNode } from 'react'
import { createChart, IChartApi } from 'lightweight-charts'
import { darken } from 'polished'
import { RowBetween } from 'components/Row'
import Card from '../Card'
import styled from 'styled-components/macro'
import useTheme from 'hooks/useTheme'

const Wrapper = styled(Card)`
  width: 100%;
  padding: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.bg0}
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
  setValue?: Dispatch<SetStateAction<number | undefined>> // used for value on hover
  topLeft?: ReactNode | undefined
  topRight?: ReactNode | undefined
  bottomLeft?: ReactNode | undefined
  bottomRight?: ReactNode | undefined
} & React.HTMLAttributes<HTMLDivElement>

const LineChart = ({
  data,
  color = '#56B2A4',
  setValue,
  topLeft,
  topRight,
  bottomLeft,
  bottomRight,
  height = DEFAULT_HEIGHT,
  ...rest
}: LineChartProps) => {
  const theme = useTheme()

  const chartRef = useRef<HTMLDivElement>(null)
  const [chartCreated, setChart] = useState<IChartApi | undefined>()

  // for reseting value on hover exit
  const currenValue = data[data.length - 1].value

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

  const textColor = theme.text2

  // if chart not instantiated in canvas, create it
  useEffect(() => {
    if (!chartCreated && data && !!chartRef?.current?.parentElement) {
      const chart = createChart(chartRef.current, {
        height: height,
        width: chartRef.current.parentElement.clientWidth - 32,
        layout: {
          backgroundColor: 'transparent',
          textColor: textColor,
          fontFamily: 'Inter',
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
        },
        watermark: {
          color: 'rgba(0, 0, 0, 0)',
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
            visible: true,
            style: 3,
            width: 1,
            color: '#505050',
            labelBackgroundColor: color,
          },
          vertLine: {
            visible: true,
            style: 3,
            width: 1,
            color: '#505050',
            labelBackgroundColor: color,
          },
        },
      })

      const series = chart.addAreaSeries({
        lineColor: color,
        topColor: darken(0.4, color),
        bottomColor: theme.bg0,
        lineWidth: 2,
        priceLineVisible: false,
      })

      series.setData(data)

      // update the title when hovering on the chart
      chart.subscribeCrosshairMove(function (param) {
        if (
          chartRef?.current &&
          (param === undefined ||
            param.time === undefined ||
            (param && param.point && param.point.x < 0) ||
            (param && param.point && param.point.x > chartRef.current.clientWidth) ||
            (param && param.point && param.point.y < 0) ||
            (param && param.point && param.point.y > height))
        ) {
          setValue && setValue(currenValue)
        } else {
          const price = parseFloat(param.seriesPrices.get(series)?.toString() ?? currenValue)
          setValue && setValue(price)
        }
      })
      chart.timeScale().fitContent()
      setChart(chart)
    }
  }, [color, chartCreated, currenValue, data, height, setValue, textColor, theme])

  return (
    <Wrapper>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <div ref={chartRef} id={'line-chart'} {...rest} />
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default LineChart
