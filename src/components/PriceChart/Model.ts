import { Token } from '@uniswap/sdk-core'
import { scaleLinear } from 'd3-scale'
import { curveBasis, line } from 'd3-shape'
import { useMemo } from 'react'
import { parse } from 'react-native-redash'
import { GraphData, GraphMetadatas, PriceList } from 'src/components/PriceChart/types'
import { normalizePath, takeSubset } from 'src/components/PriceChart/utils'
import { ChainId } from 'src/constants/chains'
import { useDailyTokenPricesQuery } from 'src/features/dataApi/slice'
import { dimensions } from 'src/styles/sizing'
import { logger } from 'src/utils/logger'

export const HEIGHT = 180
export const WIDTH = dimensions.fullWidth

export const NUM_GRAPHS = 5
export const GRAPH_PRECISION = 20 // number of points in graph

export function useGraphs(token: Token): GraphMetadatas | null {
  const {
    isError,
    error,
    currentData: dailyPrices,
  } = useDailyTokenPricesQuery({
    address: token.address,
    chainId: token.chainId as ChainId,
  })

  return useMemo(() => {
    if (!dailyPrices || isError) {
      logger.debug('PriceChart/Model', 'useGraphs', 'Historical prices error', error)
      return null
    }

    const graphs = [
      {
        label: '1D',
        index: 0,
        data: buildGraph(takeSubset(dailyPrices, 1), GRAPH_PRECISION),
      },
      {
        label: '1W',
        index: 1,
        data: buildGraph(takeSubset(dailyPrices, 7), GRAPH_PRECISION),
      },
      {
        label: '1M',
        index: 2,
        data: buildGraph(takeSubset(dailyPrices, 30), GRAPH_PRECISION),
      },
      {
        label: '1Y',
        index: 3,
        data: buildGraph(takeSubset(dailyPrices, 365), GRAPH_PRECISION),
      },
      {
        label: 'ALL',
        index: 4,
        data: buildGraph(takeSubset(dailyPrices), GRAPH_PRECISION),
      },
    ] as const

    return graphs as GraphMetadatas
  }, [dailyPrices, error, isError])
}

/** Constructs a drawable Path from a PriceList */
export function buildGraph(
  priceList: PriceList | undefined,
  precision: number,
  width = WIDTH,
  height = HEIGHT
): GraphData | null {
  if (!priceList || priceList.length === 0) return null
  priceList = priceList.reverse()

  const formattedValues = priceList.map(
    (price) => [price.timestamp, price.close] as [number, number]
  )

  const prices = formattedValues.map(([, price]) => price)
  const dates = formattedValues.map(([date]) => date)

  const lowPrice = Math.min(...prices)
  const highPrice = Math.max(...prices)
  const openPrice = prices[0]
  const closePrice = prices[prices.length - 1]

  const openDate = dates[0]
  const closeDate = dates[dates.length - 1]

  // TODO: consider using `scaleTime`
  const scaleX = scaleLinear().domain([openDate, closeDate]).range([0, width])
  const scaleY = scaleLinear().domain([lowPrice, highPrice]).range([height, 0])

  // normalize brings all paths to the same precision (number of points)
  const path = normalizePath(
    parse(
      line()
        .x(([x]) => scaleX(x) as number)
        .y(([, y]) => scaleY(y) as number)
        .curve(curveBasis)(formattedValues) as string
    ),
    precision,
    width
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
