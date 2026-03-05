// TODO: Remove this file once live auction data is implemented
// Utility functions for dev components

import { BidDistributionData, BidTokenInfo } from 'components/Toucan/Auction/store/types'

/**
 * Generates a dynamic label for a mock dataset showing tick count and price range
 * Converts tick values from smallest units (e.g., micro-USDC) to USD using bid token decimals and price
 * Uses BigInt for precision-safe calculations with high-decimal tokens
 */
export function getDatasetLabel(
  data: BidDistributionData,
  bidTokenInfo: BidTokenInfo,
): { tickCount: number; minPrice: number; maxPrice: number } {
  // Ensure data is a Map (handle deserialization edge cases)
  let mapData: Map<string, string>
  if (data instanceof Map) {
    mapData = data
  } else if (Array.isArray(data)) {
    mapData = new Map(data as [string, string][])
  } else {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Runtime safety for deserialized data
    mapData = new Map(data && typeof data === 'object' ? (Object.entries(data) as [string, string][]) : [])
  }

  const tickCount = mapData.size

  // Handle empty data
  if (tickCount === 0) {
    return {
      tickCount: 0,
      minPrice: 0,
      maxPrice: 0,
    }
  }

  const tickBigInts = Array.from(mapData.keys()).map((tick) => BigInt(tick))
  const minTickBigInt = tickBigInts.reduce((min, curr) => (curr < min ? curr : min))
  const maxTickBigInt = tickBigInts.reduce((max, curr) => (curr > max ? curr : max))

  // Convert from smallest units to decimal using BigInt division
  // We multiply by a scale factor first to preserve precision during division
  // Use the token's decimals as the scale factor to maintain full precision
  const SCALE_FACTOR = BigInt(Math.pow(10, bidTokenInfo.decimals))
  const decimalsDiv = SCALE_FACTOR

  const minPriceScaled = (minTickBigInt * SCALE_FACTOR) / decimalsDiv
  const maxPriceScaled = (maxTickBigInt * SCALE_FACTOR) / decimalsDiv

  // Convert to USD (now safe to convert to Number since we're dealing with reasonable display values)
  const minPrice = (Number(minPriceScaled) / Number(SCALE_FACTOR)) * bidTokenInfo.priceFiat
  const maxPrice = (Number(maxPriceScaled) / Number(SCALE_FACTOR)) * bidTokenInfo.priceFiat

  return {
    tickCount,
    minPrice,
    maxPrice,
  }
}
