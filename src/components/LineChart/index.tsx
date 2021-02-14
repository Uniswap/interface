import React, { useRef, useState, useEffect, useCallback, Dispatch, SetStateAction, ReactNode } from 'react'
import { createChart, IChartApi } from 'lightweight-charts'
import { darken } from 'polished'
import { RowBetween } from 'components/Row'
import Card from '../Card'

import styled from 'styled-components'
import useTheme from 'hooks/useTheme'

const Wrapper = styled(Card)`
  width: 100%;
  padding: 1rem;
  display: flex;
  background-color: ${({ theme }) => theme.bg1}
  flex-direction: column;
  > * {
    font-size: 1rem;
  }
`

const ChartContent = styled.div``

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

  // reference for DOM element to create with chart
  const chartRef = useRef(null)

  // pointer to the chart object
  const [chartCreated, setChart] = useState<IChartApi | undefined>()

  /**
   * @todo respond to dark mode
   */
  const textColor = '#565A69'

  const currenValue = data[data.length - 1].value

  const isClient = typeof window === 'object'

  const handleResize = useCallback(() => {
    chartCreated && chartCreated.resize(chartRef.current.parentNode.clientWidth - 32, height)
    chartCreated && chartCreated.timeScale().fitContent()
    chartCreated && chartCreated.timeScale().scrollToPosition(0, 0)
  }, [chartCreated, height])

  useEffect(() => {
    if (!isClient) {
      return
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isClient, chartRef, handleResize]) // Empty array ensures that effect is only run on mount and unmount

  useEffect(() => {
    if (!chartCreated && data && chartRef && chartRef.current) {
      const chart = createChart(chartRef.current, {
        height: height,
        width: chartRef.current.parentNode.clientWidth - 32,
        layout: {
          backgroundColor: 'transparent',
          textColor: textColor,
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
        bottomColor: theme.bg1,
        lineWidth: 2,
        priceLineVisible: false,
      })

      series.setData(data)

      // update the title when hovering on the chart
      chart.subscribeCrosshairMove(function (param) {
        if (
          param === undefined ||
          param.time === undefined ||
          (param && param.point && param.point.x < 0) ||
          (param && param.point && param.point.x > chartRef.current.clientWidth) ||
          (param && param.point && param.point.y < 0) ||
          (param && param.point && param.point.y > height)
        ) {
          setValue && setValue(currenValue)
        } else {
          const price = param.seriesPrices.get(series)
          setValue && setValue(price)
        }
      })

      chart.timeScale().fitContent()
      setChart(chart)
    }
  }, [chartCreated, currenValue, data, height, setValue, textColor, theme.bg1])

  return (
    <Wrapper>
      <RowBetween>
        {topLeft ?? null}
        {topRight ?? null}
      </RowBetween>
      <ChartContent ref={chartRef} id={'test-id'} {...rest} />
      <RowBetween>
        {bottomLeft ?? null}
        {bottomRight ?? null}
      </RowBetween>
    </Wrapper>
  )
}

export default LineChart
