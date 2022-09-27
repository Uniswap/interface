import { curveCardinal, scaleLinear } from 'd3'
import { filterPrices } from 'graphql/data/Token'
import { TopToken } from 'graphql/data/TopTokens'
import { TimePeriod } from 'graphql/data/util'
import React from 'react'
import { useTheme } from 'styled-components/macro'

import { DATA_EMPTY, getPriceBounds } from '../Tokens/TokenDetails/PriceChart'
import LineChart from './LineChart'

type PricePoint = { value: number; timestamp: number }

interface SparklineChartProps {
  width: number
  height: number
  tokenData: TopToken
  pricePercentChange: number | undefined | null
  timePeriod: TimePeriod
}

function SparklineChart({ width, height, tokenData, pricePercentChange, timePeriod }: SparklineChartProps) {
  const theme = useTheme()
  // for sparkline
  const pricePoints = filterPrices(tokenData?.market?.priceHistory) ?? []
  const hasData = pricePoints.length !== 0
  const startingPrice = hasData ? pricePoints[0] : DATA_EMPTY
  const endingPrice = hasData ? pricePoints[pricePoints.length - 1] : DATA_EMPTY
  const widthScale = scaleLinear()
    .domain(
      // the range of possible input values
      [startingPrice.timestamp, endingPrice.timestamp]
    )
    .range(
      // the range of possible output values that the inputs should be transformed to (see https://www.d3indepth.com/scales/ for details)
      [0, 110]
    )
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([30, 0])

  /* Default curve doesn't look good for the ALL chart */
  const curveTension = timePeriod === TimePeriod.ALL ? 0.75 : 0.9

  return (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => widthScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      curve={curveCardinal.tension(curveTension)}
      marginTop={5}
      color={pricePercentChange && pricePercentChange < 0 ? theme.accentFailure : theme.accentSuccess}
      strokeWidth={1.5}
      width={width}
      height={height}
    />
  )
}

export default React.memo(SparklineChart)
