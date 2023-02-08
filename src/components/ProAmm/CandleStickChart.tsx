import dayjs from 'dayjs'
import { CrosshairMode, IChartApi, UTCTimestamp, createChart } from 'lightweight-charts'
import React, { useEffect, useRef } from 'react'
import { Play } from 'react-feather'
import { usePrevious } from 'react-use'
import styled from 'styled-components'

import { PoolRatesEntry } from 'data/type'
import useTheme from 'hooks/useTheme'
import { useDarkModeManager } from 'state/user/hooks'
import { formatNotDollarAmount } from 'utils/numbers'

const IconWrapper = styled.div`
  position: absolute;
  right: 10px;
  color: ${({ theme }) => theme.text};
  border-radius: 3px;
  height: 16px;
  width: 16px;
  padding: 0px;
  bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  :hover {
    cursor: pointer;
    opacity: 0.7;
  }
`

type CandleStickChartPropsType = {
  data: PoolRatesEntry[] | undefined | null
  width?: number
  height?: number
  base: number
  onSetCurrentRate: (data: { price: string; time?: string }) => void
}

const valueFormatter = (val: number) => {
  let e: number
  if (val < 1.01 && val > 0.99) {
    const leftover = Math.abs(val - 1)
    e = parseInt(leftover.toExponential().match(/e([+-][0-9]+)/)?.[1] ?? '0')
  } else {
    e = parseInt(val.toExponential().match(/e([+-][0-9]+)/)?.[1] ?? '0')
  }
  return formatNotDollarAmount(val, 3 - e)
}

const CandleStickChart = ({
  data,
  width,
  height = 300,
  base,
  onSetCurrentRate,
}: CandleStickChartPropsType): JSX.Element => {
  // reference for DOM element to create with chart
  const ref = useRef<HTMLDivElement>(null)
  const formattedData = data?.map(entry => ({
    time: entry.time as UTCTimestamp,
    open: entry.open,
    low: entry.open,
    close: entry.close,
    high: entry.close,
  }))

  if (formattedData && formattedData?.length > 0) {
    formattedData.push({
      time: dayjs().unix() as UTCTimestamp,
      open: formattedData[formattedData.length - 1].close,
      close: base,
      low: Math.min(base, formattedData[formattedData.length - 1].close),
      high: Math.max(base, formattedData[formattedData.length - 1].close),
    })
  }

  // pointer to the chart object
  const chartCreated = useRef<IChartApi | null>(null)
  const dataPrev = usePrevious(data)

  const [darkMode] = useDarkModeManager()
  const textColor = darkMode ? 'white' : 'black'
  const theme = useTheme()
  const previousTheme = usePrevious(darkMode)

  // reset the chart if theme switches
  useEffect(() => {
    if (chartCreated.current && previousTheme !== darkMode) {
      // remove the tooltip element
      const tooltip = document.getElementById('tooltip-id')
      const node = ref.current
      tooltip && node?.removeChild(tooltip)
      chartCreated.current.resize(0, 0)
      chartCreated.current = null
    }
  }, [chartCreated, darkMode, previousTheme])

  useEffect(() => {
    if (data !== dataPrev && chartCreated.current) {
      // remove the tooltip element
      const tooltip = document.getElementById('tooltip-id')
      const currentChart = document.getElementsByClassName('tv-lightweight-charts')
      const node = ref.current
      tooltip && node?.removeChild(tooltip)
      if (currentChart.length > 0) {
        node?.removeChild(currentChart[0])
      }
      chartCreated.current.resize(0, 0)
      chartCreated.current = null
    }
  }, [chartCreated, data, dataPrev])

  // if no chart created yet, create one with options and add to DOM manually
  useEffect(() => {
    if (!chartCreated.current && ref.current && formattedData && formattedData?.length > 0) {
      const chart = createChart(ref.current, {
        width,
        height,
        layout: {
          backgroundColor: 'transparent',
          textColor: textColor,
        },
        grid: {
          vertLines: {
            color: darkMode ? '#40505A4d' : '#C2C2C233',
          },
          horzLines: {
            color: darkMode ? '#40505A4d' : '#C2C2C233',
          },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
          visible: true,
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.8)',
        },
        localization: {
          priceFormatter: (val: number) => formatNotDollarAmount(val, 6),
        },
      })

      const candleSeries = chart.addCandlestickSeries({
        upColor: '#31CB9E',
        downColor: '#FF537B',
        borderDownColor: '#FF537B',
        borderUpColor: '#31CB9E',
        wickDownColor: '#FF537B',
        wickUpColor: '#31CB9E',
        priceFormat: {
          // type: 'price',
          precision: 6,
          minMove: 0.000001,
        },
      })

      candleSeries.setData(formattedData)

      const setLastBarText = () => {
        onSetCurrentRate({ price: valueFormatter(base) })
      }

      // get the title of the chart
      setLastBarText()

      // update the title when hovering on the chart
      chart.subscribeCrosshairMove(function (param: any) {
        if (
          !width ||
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
          const price = param.seriesPrices.get(candleSeries)?.close
          const time = dayjs.unix(param.time as number).format('MM/DD h:mm:ss A')
          onSetCurrentRate({ price: valueFormatter(price), time })
        }
      })
      chart.timeScale().fitContent()

      chartCreated.current = chart
    }
  }, [
    theme.subText,
    theme.text,
    chartCreated,
    formattedData,
    width,
    height,
    base,
    textColor,
    darkMode,
    onSetCurrentRate,
  ])

  // responsiveness
  useEffect(() => {
    if (width) {
      chartCreated.current?.resize(width, height, true)
      chartCreated.current?.timeScale().scrollToPosition(0, true)
    }
  }, [chartCreated, height, width])

  return (
    <>
      <div ref={ref} id="test-id" />
      <IconWrapper>
        <Play
          onClick={() => {
            chartCreated.current?.timeScale().fitContent()
          }}
        />
      </IconWrapper>
    </>
  )
}

export default CandleStickChart
