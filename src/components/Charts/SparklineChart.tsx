import { filterTimeAtom } from 'components/Tokens/state'
import { SparkLineLoadingBubble } from 'components/Tokens/TokenTable/TokenRow'
import { curveCardinal, scaleLinear } from 'd3'
import dayjs from 'dayjs'
import { fetchTokenPriceData } from 'graphql/tokens/NewTokenPrice'
import { TokenData } from 'graphql/tokens/TokenData'
import { PricePoint, TimePeriod } from 'graphql/utils/util'
import { useAtomValue } from 'jotai/utils'
import { memo, useEffect, useMemo, useState } from 'react'
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
  pricePercentChange?: number | null
}

function _SparklineChart({ width, height, tokenData, pricePercentChange }: SparklineChartProps) {
  const theme = useTheme()
  const timePeriod = useAtomValue(filterTimeAtom)
  // for sparkline

  const utcCurrentTime = dayjs()
  const startTimestamp = useMemo(() => {
    switch (timePeriod) {
      case TimePeriod.DAY:
        return utcCurrentTime.subtract(1, 'day').startOf('minute').unix()
      case TimePeriod.WEEK:
        return utcCurrentTime.subtract(1, 'week').startOf('hour').unix()
      case TimePeriod.MONTH:
        return utcCurrentTime.subtract(1, 'month').startOf('hour').unix()
      case TimePeriod.YEAR:
        return utcCurrentTime.subtract(1, 'year').startOf('day').unix()
    }
  }, [timePeriod, utcCurrentTime])

  const qtyDataPerTime = useMemo(() => {
    switch (timePeriod) {
      case TimePeriod.DAY:
        return 24
      case TimePeriod.WEEK:
        return 168
      case TimePeriod.MONTH:
        return 730
      case TimePeriod.YEAR:
        return 8760
    }
  }, [timePeriod])

  const [data, setData] = useState<PriceChartEntry[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await fetchTokenPriceData(tokenData.address, ONE_HOUR_SECONDS, startTimestamp, qtyDataPerTime)
      setData(data)
    }

    fetchData()
  }, [startTimestamp, tokenData.address, qtyDataPerTime])

  const pricePoints = useMemo(() => {
    const priceMap = new Map<number, PricePoint>()

    data.forEach((price) => {
      if (!priceMap.has(price.time)) {
        priceMap.set(price.time, {
          timestamp: price.time,
          value: price.close,
        })
      }
    })

    const pricePoint: PricePoint[] = Array.from(priceMap.values())

    return tokenData?.address ? pricePoint : null
  }, [data, tokenData?.address])

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
