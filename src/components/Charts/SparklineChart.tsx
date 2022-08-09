import { scaleLinear } from 'd3'
import useTheme from 'hooks/useTheme'
import React from 'react'

import data from './data.json'
import LineChart from './LineChart'

type PricePoint = { value: number; timestamp: number }

function getPriceBounds(pricePoints: PricePoint[]): [number, number] {
  const prices = pricePoints.map((x) => x.value)
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  return [min, max]
}

interface SparklineChartProps {
  width: number
  height: number
}

function SparklineChart({ width, height }: SparklineChartProps) {
  const theme = useTheme()

  /* TODO: Implement API calls & cache to use here */
  const pricePoints = data.day
  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]

  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, width])
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([height, 0])

  const isPositive = endingPrice.value >= startingPrice.value

  return (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => timeScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      marginTop={0}
      color={isPositive ? theme.accentSuccess : theme.accentFailure}
      strokeWidth={1.5}
      width={width}
      height={height}
    ></LineChart>
  )
}

export default React.memo(SparklineChart)
