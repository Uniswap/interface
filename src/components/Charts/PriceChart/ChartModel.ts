import { ScaleLinear, scaleLinear } from 'd3'
import { PricePoint } from 'graphql/data/util'

import { cleanPricePoints, getPriceBounds } from './utils'

export enum ChartErrorType {
  NO_DATA_AVAILABLE,
  NO_RECENT_VOLUME,
  INVALID_CHART,
}

type ChartDimensions = {
  width: number
  height: number
  marginTop: number
  marginBottom: number
}

export type ErroredChartModel = { error: ChartErrorType; dimensions: ChartDimensions }

export type ChartModel = {
  prices: PricePoint[]
  startingPrice: PricePoint
  endingPrice: PricePoint
  lastValidPrice: PricePoint
  blanks: PricePoint[][]
  timeScale: ScaleLinear<number, number>
  priceScale: ScaleLinear<number, number>
  dimensions: ChartDimensions
  error: undefined
}

type ChartModelArgs = { prices?: PricePoint[]; dimensions: ChartDimensions }
export function buildChartModel({ dimensions, prices }: ChartModelArgs): ChartModel | ErroredChartModel {
  if (!prices) {
    return { error: ChartErrorType.NO_DATA_AVAILABLE, dimensions }
  }

  const innerHeight = dimensions.height - dimensions.marginTop - dimensions.marginBottom
  if (innerHeight < 0) {
    return { error: ChartErrorType.INVALID_CHART, dimensions }
  }

  const { prices: fixedPrices, blanks, lastValidPrice } = cleanPricePoints(prices)
  if (fixedPrices.length < 2 || !lastValidPrice) {
    return { error: ChartErrorType.NO_RECENT_VOLUME, dimensions }
  }

  const startingPrice = prices[0]
  const endingPrice = prices[prices.length - 1]
  const { min, max } = getPriceBounds(prices)

  // x-axis scale
  const timeScale = scaleLinear().domain([startingPrice.timestamp, endingPrice.timestamp]).range([0, dimensions.width])

  // y-axis scale
  const priceScale = scaleLinear().domain([min, max]).range([innerHeight, 0])

  return {
    prices: fixedPrices,
    startingPrice,
    endingPrice,
    lastValidPrice,
    blanks,
    timeScale,
    priceScale,
    dimensions,
    error: undefined,
  }
}
