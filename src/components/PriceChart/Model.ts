import { Token } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { useMemo } from 'react'
import { parse } from 'react-native-redash'
import { GraphData, GraphMetadatas, PriceList } from 'src/components/PriceChart/types'
import { useDailyTokenPrices, useHourlyTokenPrices } from 'src/features/historicalChainData/hooks'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5

const HOURS_IN_DAY = 24
const HOURS_IN_WEEK = 24 * 7
const HOURS_IN_MONTH = HOURS_IN_WEEK * 4
const DAYS_IN_YEAR = 365

// TODO(#89): use date manipulation util
const d = new Date()
const ONE_MONTH_AGO = d.setMonth(d.getMonth() - 1)

export function useGraphs(token: Token): GraphMetadatas | null {
  const hourlyTokenData = useHourlyTokenPrices({ token, timestamp: ONE_MONTH_AGO })
  const dailyTokenData = useDailyTokenPrices({ token })

  const isError = dailyTokenData.isError || hourlyTokenData.isError

  const hourlyTokenPrices = useMemo(
    () => ({
      // TODO(judo): interpolation requires same data length
      // TODO(#80): use block-level data and add 1h chart
      oneDay: hourlyTokenData.prices?.slice(0, HOURS_IN_DAY),
      oneWeek: hourlyTokenData.prices?.slice(0, HOURS_IN_WEEK),
      oneMonth: hourlyTokenData.prices?.slice(0, HOURS_IN_MONTH),
    }),
    [hourlyTokenData]
  )

  const dailyTokenPrices = useMemo(
    () => ({
      oneYear: dailyTokenData.prices?.slice(0, DAYS_IN_YEAR),
      all: dailyTokenData.prices,
    }),
    [dailyTokenData]
  )

  return useMemo(() => {
    if (isError) {
      logger.error(
        'PriceChart/Model',
        'useGraphs',
        'Historical prices error',
        dailyTokenData.error ?? hourlyTokenData.error
      )
      return null
    }

    const graphs = [
      {
        label: '1D',
        index: 0,
        data: buildGraph(hourlyTokenPrices.oneDay),
      },
      {
        label: '1W',
        index: 1,
        data: buildGraph(hourlyTokenPrices.oneWeek),
      },
      {
        label: '1M',
        index: 2,
        data: buildGraph(hourlyTokenPrices.oneMonth),
      },
      {
        label: '1Y',
        index: 3,
        data: buildGraph(dailyTokenPrices.oneYear),
      },
      {
        label: 'all',
        index: 4,
        data: buildGraph(dailyTokenPrices.all),
      },
    ] as const

    return graphs as GraphMetadatas
  }, [
    isError,
    hourlyTokenPrices.oneDay,
    hourlyTokenPrices.oneWeek,
    hourlyTokenPrices.oneMonth,
    dailyTokenPrices.oneYear,
    dailyTokenPrices.all,
    dailyTokenData.error,
    hourlyTokenData.error,
  ])
}

/**
 * Constructs a drawable Path from a PriceList
 */
export function buildGraph(datapoints: PriceList | undefined): GraphData | null {
  if (!datapoints || datapoints.length === 0) return null

  const priceList = datapoints.slice(0, 24).reverse()

  const formattedValues = priceList.map(
    (price) => [price.timestamp, parseFloat(price.close)] as [number, number]
  )

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const startingPrice = prices[0]

  const scaleX = scaleLinear()
    .domain([dates[0], dates[dates.length - 1]])
    .range([0, WIDTH])
  const scaleY = scaleLinear().domain([minPrice, maxPrice]).range([HEIGHT, 0])

  const path = parse(
    line()
      .x(([x]) => scaleX(x) as number)
      .y(([, y]) => scaleY(y) as number)
      .curve(curveBasis)(formattedValues) as string
  )

  return {
    minPrice,
    maxPrice,
    startingPrice,
    path,
  }
}
