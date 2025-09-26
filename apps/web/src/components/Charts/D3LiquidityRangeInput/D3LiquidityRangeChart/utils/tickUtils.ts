import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'

/**
 * Finds the closest tick to a target price
 */
export const findClosestTick = (liquidityData: ChartEntry[], targetPrice: number): ChartEntry | undefined => {
  return liquidityData.reduce((closest, current) => {
    const currentDiff = Math.abs(current.price0 - targetPrice)
    const closestDiff = Math.abs(closest.price0 - targetPrice)
    return currentDiff < closestDiff ? current : closest
  })
}

/**
 * Calculates tick indices with price information for efficient lookups
 */
export const calculateTickIndices = (liquidityData: ChartEntry[]) => {
  return liquidityData.map((d, i) => ({
    tick: d.tick ?? 0,
    index: i,
    price: d.price0,
  }))
}

/**
 * Gets the minimum and maximum bounds from price and liquidity data
 */
export const getDataBounds = (data: PriceChartData[], liquidityData: ChartEntry[]) => {
  const allPrices = [...data.map((d) => d.value), ...liquidityData.map((d) => d.price0)]
  return {
    min: Math.min(...allPrices),
    max: Math.max(...allPrices),
  }
}

/**
 * Navigates to the next or previous tick from a given price
 */
export const navigateTick = ({
  liquidityData,
  currentPrice,
  direction,
}: {
  liquidityData: ChartEntry[]
  currentPrice: number
  direction: 'next' | 'prev'
}): number | undefined => {
  const currentTick = findClosestTick(liquidityData, currentPrice)

  if (!currentTick) {
    return undefined
  }

  const tickIndices = calculateTickIndices(liquidityData)
  const currentIndex = tickIndices.find((t) => t.tick === currentTick.tick)?.index || 0

  const targetIndex =
    direction === 'next' ? Math.min(currentIndex + 1, liquidityData.length - 1) : Math.max(currentIndex - 1, 0)

  const targetTick = liquidityData[targetIndex]

  return targetTick.price0
}

/**
 * Calculates new price range based on center tick and tick range size
 */
export const calculateNewRange = ({
  centerTick,
  tickRangeSize,
  tickIndices,
  liquidityData,
}: {
  centerTick: ChartEntry
  tickRangeSize: number
  tickIndices: { tick: number; index: number; price: number }[]
  liquidityData: ChartEntry[]
}) => {
  const centerIndex = tickIndices.find((t) => t.tick === centerTick.tick)?.index || 0
  const halfRange = Math.floor(tickRangeSize / 2)

  const newMinIndex = Math.max(0, centerIndex - halfRange)
  const newMaxIndex = Math.min(liquidityData.length - 1, centerIndex + halfRange)

  return {
    minPrice: tickIndices[newMinIndex]?.price,
    maxPrice: tickIndices[newMaxIndex]?.price,
  }
}
