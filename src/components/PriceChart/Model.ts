import { Token } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { useMemo } from 'react'
import { parse } from 'react-native-redash'
import { PricesQuery } from 'src/features/historicalChainData/generated'
import { useHistoricalPrices } from 'src/features/historicalChainData/hooks'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

const POINTS = 60

type Price = Pick<PricesQuery['tokenDayDatas'][0], 'timestamp' | 'close' | 'open'>
type PriceList = Price[]

export const NUM_GRAPHS = 5

export type GraphIndex = 0 | 1 | 2 | 3 | 4
export type GraphMetadata = Readonly<{
  label: string
  value: GraphIndex
  data: ReturnType<typeof buildGraph>
}>

export function useGraphs(token: Token): { isLoading: boolean; graphs: GraphMetadata[] } {
  const { isLoading, data, isError, error } = useHistoricalPrices({
    token,
  })

  if (isError) {
    logger.error(error)
  }

  return useMemo(() => {
    if (isLoading || !data) return { isLoading: true, graphs: [] }

    const { tokenDayDatas, tokenHourDatas } = data

    return {
      isLoading: false,
      graphs: [
        {
          label: '1H',
          value: 0,
          data: buildGraph(tokenHourDatas),
        },
        {
          label: '1D',
          value: 1,
          data: buildGraph(tokenDayDatas),
        },
        {
          label: '1M',
          value: 2,
          data: buildGraph(tokenDayDatas),
        },
        {
          label: '1Y',
          value: 3,
          data: buildGraph(tokenDayDatas),
        },
        {
          label: 'all',
          value: 4,
          data: buildGraph(tokenDayDatas),
        },
      ] as Readonly<GraphMetadata>[],
    }
  }, [isLoading, data])
}

// TODO(judo): handle no datapoints
export function buildGraph(datapoints: PriceList) {
  const priceList = datapoints.slice(0, POINTS).reverse()

  const formattedValues = priceList.map(
    (price) => [price.timestamp, parseFloat(price.close)] as [number, number]
  )

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)

  const percentChange = datapoints[datapoints.length - 1].close / datapoints[0].open

  const scaleX = scaleLinear()
    .domain([Math.min(...dates), Math.max(...dates)])
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
    percentChange,
    path,
  }
}
