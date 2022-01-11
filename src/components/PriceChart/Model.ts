import { Token } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { parse } from 'react-native-redash'
import { GraphData, GraphMetadatas, PriceList } from 'src/components/PriceChart/types'
import { normalizePath, takeSubset } from 'src/components/PriceChart/utils'
import { useDailyTokenPrices, useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5
export const GRAPH_PRECISION = 20 // number of points in graph

const HOURS_IN_DAY = 24
const HOURS_IN_WEEK = HOURS_IN_DAY * 7
const HOURS_IN_MONTH = HOURS_IN_WEEK * 4
const DAYS_IN_YEAR = 365

export function useGraphs(token: Token): GraphMetadatas | null {
  const oneMonthAgo = dayjs().subtract(1, 'month').startOf('hour').unix()

  const hourlyTokenData = useHourlyTokenPrices({ token, periodStartUnix: oneMonthAgo })
  const dailyTokenData = useDailyTokenPrices({ token })

  const isError = hourlyTokenData.isError || dailyTokenData.isError

  // build graph data for each data set to reduce the number of re-renders

  const graphDataDerivedFromHours = useMemo(
    () => ({
      // TODO(judo): consider not slicing price data for performance
      oneDay: buildGraph(takeSubset(hourlyTokenData.prices, HOURS_IN_DAY), GRAPH_PRECISION),
      oneWeek: buildGraph(takeSubset(hourlyTokenData.prices, HOURS_IN_WEEK), GRAPH_PRECISION),
      oneMonth: buildGraph(takeSubset(hourlyTokenData.prices, HOURS_IN_MONTH), GRAPH_PRECISION),
    }),
    [hourlyTokenData.prices]
  )

  const graphDataDerivedFromDays = useMemo(
    () => ({
      oneYear: buildGraph(takeSubset(dailyTokenData.prices, DAYS_IN_YEAR), GRAPH_PRECISION),
      all: buildGraph(dailyTokenData.prices?.slice(), GRAPH_PRECISION),
    }),
    [dailyTokenData.prices]
  )

  return useMemo(() => {
    if (isError) {
      logger.debug(
        'PriceChart/Model',
        'useGraphs',
        'Historical prices error',
        dailyTokenData.error ?? hourlyTokenData.error
      )
      return null
    }

    // TODO: consider lazy building graphs
    const graphs = [
      {
        label: '1D',
        index: 0,
        data: graphDataDerivedFromHours.oneDay,
      },
      {
        label: '1W',
        index: 1,
        data: graphDataDerivedFromHours.oneWeek,
      },
      {
        label: '1M',
        index: 2,
        data: graphDataDerivedFromHours.oneMonth,
      },
      {
        label: '1Y',
        index: 3,
        data: graphDataDerivedFromDays.oneYear,
      },
      {
        label: 'ALL',
        index: 4,
        data: graphDataDerivedFromDays.all,
      },
    ] as const

    return graphs as GraphMetadatas
  }, [
    isError,
    graphDataDerivedFromDays.all,
    graphDataDerivedFromDays.oneYear,
    graphDataDerivedFromHours.oneMonth,
    graphDataDerivedFromHours.oneWeek,
    graphDataDerivedFromHours.oneDay,
    dailyTokenData.error,
    hourlyTokenData.error,
  ])
}

/** Constructs a drawable Path from a PriceList */
export function buildGraph(datapoints: PriceList | undefined, precision: number): GraphData | null {
  if (!datapoints || datapoints.length === 0) return null

  const priceList = datapoints.reverse()

  const formattedValues = priceList.map(
    (price) => [price.timestamp, parseFloat(price.close)] as [number, number]
  )

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)
  const openPrice = prices[0]
  const closePrice = prices[prices.length - 1]

  const openDate = dates[0]
  const closeDate = dates[dates.length - 1]

  const scaleX = scaleLinear().domain([openDate, closeDate]).range([0, WIDTH])
  const scaleY = scaleLinear().domain([lowPrice, highPrice]).range([HEIGHT, 0])

  // normalize brings all paths to the same precision (number of points)
  const path = normalizePath(
    parse(
      line()
        .x(([x]) => scaleX(x) as number)
        .y(([, y]) => scaleY(y) as number)
        .curve(curveBasis)(formattedValues) as string
    ),
    precision,
    WIDTH
  )

  return {
    openDate,
    closeDate,
    lowPrice,
    highPrice,
    openPrice,
    closePrice,
    path,
  }
}
