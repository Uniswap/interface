import { curveCardinal, scaleLinear } from 'd3'
import { SparklineMap, TopToken } from 'graphql/data/TopTokens'
import { PricePoint } from 'graphql/data/util'
import { memo } from 'react'
import styled, { useTheme } from 'styled-components'

import { LoadingBubble } from 'components/Tokens/loading'
import { getPriceBounds } from '../PriceChart/utils'
import LineChart from './LineChart'

const LoadingContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

const LongLoadingBubble = styled(LoadingBubble)`
  width: 90%;
`

const SparkLineLoadingBubble = styled(LongLoadingBubble)`
  height: 4px;
`

interface SparklineChartProps {
  width: number
  height: number
  tokenData: TopToken
  pricePercentChange?: number | null
  sparklineMap: SparklineMap
}

function _SparklineChart({ width, height, tokenData, pricePercentChange, sparklineMap }: SparklineChartProps) {
  const theme = useTheme()
  // for sparkline
  const pricePoints = tokenData?.address ? sparklineMap[tokenData.address] : null

  // Don't display if there's one or less pricepoints
  if (!pricePoints || pricePoints.length <= 1) {
    return (
      <LoadingContainer>
        <SparkLineLoadingBubble />
      </LoadingContainer>
    )
  }

  const startingPrice = pricePoints[0]
  const endingPrice = pricePoints[pricePoints.length - 1]
  const widthScale = scaleLinear()
    .domain(
      // the range of possible input values
      [startingPrice.timestamp, endingPrice.timestamp]
    )
    .range(
      // the range of possible output values that the inputs should be transformed to (see https://www.d3indepth.com/scales/ for details)
      [0, 110]
    )

  const { min, max } = getPriceBounds(pricePoints)
  const rdScale = scaleLinear().domain([min, max]).range([30, 0])
  const curveTension = 0.9

  return (
    <LineChart
      data={pricePoints}
      getX={(p: PricePoint) => widthScale(p.timestamp)}
      getY={(p: PricePoint) => rdScale(p.value)}
      curve={curveCardinal.tension(curveTension)}
      marginTop={5}
      color={pricePercentChange && pricePercentChange < 0 ? theme.critical : theme.success}
      strokeWidth={1.5}
      width={width}
      height={height}
    />
  )
}

export default memo(_SparklineChart)
