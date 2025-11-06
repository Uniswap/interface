import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { nearestUsableTick, priceToClosestTick, TickMath, tickToPrice as tickToPriceV3 } from '@uniswap/v3-sdk'
import { priceToClosestTick as priceToClosestV4Tick, tickToPrice as tickToPriceV4 } from '@uniswap/v4-sdk'
import { TickNavigationParams } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/store/types'
import { ChartEntry } from 'components/Charts/LiquidityRangeInput/types'
import { PriceChartData } from 'components/Charts/PriceChart'
import { tryParsePrice } from 'state/mint/v3/utils'
import { logger } from 'utilities/src/logger/logger'

const PRICE_FIXED_DIGITS = 8

/**
 * Navigates price by tick spacing
 * using v3/v4 sdk functions
 */
export const navigateTick = ({
  currentPrice,
  tickSpacing,
  direction,
  baseCurrency,
  quoteCurrency,
  priceInverted,
  protocolVersion,
}: TickNavigationParams & { currentPrice: number; direction: 'increment' | 'decrement' }) => {
  try {
    if (!baseCurrency || !quoteCurrency) {
      return undefined
    }

    const adjustedDirection = priceInverted ? (direction === 'increment' ? 'decrement' : 'increment') : direction

    if (protocolVersion === ProtocolVersion.V3 || !protocolVersion) {
      const baseToken = baseCurrency.wrapped
      const quoteToken = quoteCurrency.wrapped

      const price = tryParsePrice({
        baseToken,
        quoteToken,
        value: currentPrice.toString(),
      })

      if (!price) {
        return undefined
      }

      let tick = priceToClosestTick(price)

      if (tick > TickMath.MAX_TICK) {
        tick = TickMath.MAX_TICK
      } else if (tick < TickMath.MIN_TICK) {
        tick = TickMath.MIN_TICK
      }

      const currentTick = nearestUsableTick(tick, tickSpacing)
      const newTick = adjustedDirection === 'increment' ? currentTick + tickSpacing : currentTick - tickSpacing

      const newPriceObj = tickToPriceV3(baseToken, quoteToken, newTick)
      return parseFloat(newPriceObj.toFixed(PRICE_FIXED_DIGITS))
    }

    if (protocolVersion === ProtocolVersion.V4) {
      const price = tryParsePrice({
        baseToken: baseCurrency,
        quoteToken: quoteCurrency,
        value: currentPrice.toString(),
      })

      if (!price) {
        return undefined
      }

      let tick = priceToClosestV4Tick(price)

      if (tick > TickMath.MAX_TICK) {
        tick = TickMath.MAX_TICK
      } else if (tick < TickMath.MIN_TICK) {
        tick = TickMath.MIN_TICK
      }

      const currentTick = nearestUsableTick(tick, tickSpacing)
      const newTick = adjustedDirection === 'increment' ? currentTick + tickSpacing : currentTick - tickSpacing

      const newPriceObj = tickToPriceV4(baseCurrency, quoteCurrency, newTick)
      return parseFloat(newPriceObj.toFixed(PRICE_FIXED_DIGITS))
    }

    return undefined
  } catch (error) {
    logger.error(error, {
      tags: {
        file: 'navigateTick',
        function: 'navigateTick',
      },
    })
    return undefined
  }
}

/**
 * Finds the closest tick from liquidity data to a target price
 */
export const findClosestTick = (liquidityData: ChartEntry[], targetPrice: number): ChartEntry | undefined => {
  return liquidityData.reduce((closest, current) => {
    const currentDiff = Math.abs(current.price0 - targetPrice)
    const closestDiff = Math.abs(closest.price0 - targetPrice)
    return currentDiff < closestDiff ? current : closest
  })
}

/**
 * Calculates tick indices with price information for efficient lookups from liquidity data
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
