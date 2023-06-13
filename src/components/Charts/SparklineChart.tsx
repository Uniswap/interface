import { SparkLineLoadingBubble } from 'components/Tokens/TokenTable/TokenRow'
import { curveCardinal, scaleLinear } from 'd3'
import dayjs from 'dayjs'
import { PricePoint } from 'graphql/data/util'
import { fetchTokenPriceData } from 'graphql/tokens/NewTokenPrice'
import { TokenData } from 'graphql/tokens/TokenData'
import { memo, useEffect, useState } from 'react'
import styled, { useTheme } from 'styled-components/macro'
import { PriceChartEntry } from 'types/chart'
import { ONE_HOUR_SECONDS } from 'utils/intervals'

import { getPriceBounds } from '../Tokens/TokenDetails/PriceChart'
import LineChart from './LineChart'

const LoadingContainer = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
`

interface SparklineChartProps {
  width: number
  height: number
  tokenData: TokenData
  pricePercentChange: number | undefined | null
}

function _SparklineChart({ width, height, tokenData, pricePercentChange }: SparklineChartProps) {
  const theme = useTheme()
  // for sparkline

  const utcCurrentTime = dayjs()
  const startTimestamp = utcCurrentTime.subtract(1, 'week').startOf('hour').unix()
  const [data, setData] = useState<PriceChartEntry[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await fetchTokenPriceData(tokenData.address, ONE_HOUR_SECONDS, startTimestamp)
      setData(data)
    }

    fetchData()
  }, [startTimestamp, tokenData.address])

  const pricePoint = [] as PricePoint[]
  data.map((price) => {
    pricePoint.push({ timestamp: price.time, value: price.open })
    pricePoint.push({ timestamp: price.time, value: price.close })
  })

  const pricePoints = tokenData?.address ? pricePoint : null

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
  const rdScale = scaleLinear().domain(getPriceBounds(pricePoints)).range([30, 0])
  const curveTension = 0.9

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

export default memo(_SparklineChart)
