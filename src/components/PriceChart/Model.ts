import { Token } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { useMemo } from 'react'
import { parse, Path } from 'react-native-redash'
import { GraphMetadatas, PriceList } from 'src/components/PriceChart/types'
import { useHistoricalPrices } from 'src/features/historicalChainData/hooks'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5

const HOURS_IN_DAY = 24
const HOURS_IN_WEEK = 24 * 7
const HOURS_IN_MONTH = HOURS_IN_WEEK * 4
const DAYS_IN_YEAR = 365

export function useGraphs(token: Token): GraphMetadatas | null {
  const { isLoading, data, isError, error } = useHistoricalPrices({
    token,
  })

  if (isError) {
    logger.error('PriceChart/Model', 'useGraphs', 'Historical prices error', error)
  }

  const dataByRange = useMemo(
    () =>
      data && data.tokenHourDatas.length > 0 && data.tokenDayDatas.length > 0
        ? {
            // TODO(judo): interpolation requires same data length
            // TODO(#80): use block-level data and add 1h chart
            oneDay: data.tokenHourDatas.slice(0, HOURS_IN_DAY),
            oneWeek: data.tokenHourDatas.slice(0, HOURS_IN_WEEK),
            oneMonth: data.tokenHourDatas.slice(0, HOURS_IN_MONTH),
            oneYear: data.tokenDayDatas.slice(0, DAYS_IN_YEAR),
            all: data.tokenDayDatas.slice(),
          }
        : undefined,
    [data]
  )

  return useMemo(() => {
    if (isLoading || isError || !dataByRange) return null

    const { oneDay, oneWeek, oneMonth, oneYear, all } = dataByRange

    const graphs = [
      {
        label: '1D',
        index: 0,
        data: buildGraph(oneDay),
      },
      {
        label: '1W',
        index: 1,
        data: buildGraph(oneWeek),
      },
      {
        label: '1M',
        index: 2,
        data: buildGraph(oneMonth),
      },
      {
        label: '1Y',
        index: 3,
        data: buildGraph(oneYear),
      },
      {
        label: 'all',
        index: 4,
        data: buildGraph(all),
      },
    ] as const

    return graphs
  }, [isLoading, isError, dataByRange])
}

// TODO(judo): handle no datapoints
/**
 * Constructs a drawable Path from a PriceList
 */
export function buildGraph(datapoints: PriceList): {
  minPrice: number
  maxPrice: number
  startingPrice: number
  path: Path
} {
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
