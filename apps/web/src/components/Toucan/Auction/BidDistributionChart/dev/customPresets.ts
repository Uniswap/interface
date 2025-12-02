// TODO: Remove this file once live auction data is implemented
// Utilities for generating custom bid distribution presets

import { BidDistributionData } from 'components/Toucan/Auction/store/types'

// Auction token always has 18 decimals (matches FAKE_AUCTION_DATA.tokenDecimals)
export const AUCTION_TOKEN_DECIMALS = 18

// eslint-disable-next-line import/no-unused-modules -- Exported for type safety
export interface BidTokenConfig {
  address: string
  symbol: 'USDC' | 'ETH'
  decimals: number
  defaultTickSize: string // raw value (e.g., "500000" for 0.50 USDC)
  defaultTickSizeHuman: string // human readable (e.g., "0.50")
  defaultClearingPrice: string // raw value
  defaultClearingPriceHuman: string // human readable
}

export const BID_TOKEN_CONFIGS: Record<'USDC' | 'ETH', BidTokenConfig> = {
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    decimals: 6,
    defaultTickSize: '500000', // 0.50 USDC
    defaultTickSizeHuman: '0.50',
    defaultClearingPrice: '5000000', // 5.00 USDC
    defaultClearingPriceHuman: '5.00',
  },
  ETH: {
    address: '0x0000000000000000000000000000000000000000', // native ETH
    symbol: 'ETH',
    decimals: 18,
    defaultTickSize: '100000000000000', // 0.0001 ETH
    defaultTickSizeHuman: '0.0001',
    defaultClearingPrice: '1000000000000000', // 0.001 ETH
    defaultClearingPriceHuman: '0.001',
  },
}

export interface CustomPresetParams {
  bidToken: 'USDC' | 'ETH'
  bidTokenAddress: string // actual token address (needed for useBidTokenInfo)
  tickSize: string // raw value
  clearingPrice: string // raw value
  tickRangeMin: number // multiplier (e.g., 1 means 1x tickSize)
  tickRangeMax: number // multiplier
  tickCount: number
  bidVolumeMin: string // raw value in bid token smallest units
  bidVolumeMax: string // raw value in bid token smallest units
  totalSupply: string // total supply of auction token
}

export interface SavedCustomPreset extends CustomPresetParams {
  id: string
  name: string
  createdAt: number
  distributionData: BidDistributionData
}

/**
 * Generates random bid distribution data based on preset parameters
 * Uses BigInt for precision-safe calculations
 * Distribution is weighted to cluster near and above clearing price (like an order book)
 */
export function generateRandomBidDistribution(params: CustomPresetParams): BidDistributionData {
  const { tickSize, clearingPrice, tickRangeMin, tickRangeMax, tickCount, bidVolumeMin, bidVolumeMax } = params

  // Calculate available ticks in the range
  const availableTicks = tickRangeMax - tickRangeMin + 1

  if (tickCount > availableTicks) {
    throw new Error(`Tick count (${tickCount}) cannot exceed available range (${availableTicks})`)
  }

  if (tickCount < 1) {
    throw new Error('Tick count must be at least 1')
  }

  const tickSizeBigInt = BigInt(tickSize)
  const clearingPriceBigInt = BigInt(clearingPrice)
  const volumeMinBigInt = BigInt(bidVolumeMin)
  const volumeMaxBigInt = BigInt(bidVolumeMax)
  const volumeRange = volumeMaxBigInt - volumeMinBigInt

  // Calculate which tick multiplier the clearing price falls at/near
  const clearingMultiplier = Number(clearingPriceBigInt / tickSizeBigInt)

  // Generate random unique tick multipliers with clustering near clearing price
  const tickMultipliers = new Set<number>()
  while (tickMultipliers.size < tickCount) {
    let randomMultiplier: number

    // Decide if this should be below or at/above clearing price
    // 70% of ticks should be at or above clearing price for realistic orderbook look
    const isAboveOrAtClearing = Math.random() > 0.3

    if (isAboveOrAtClearing) {
      // Generate ticks at or above clearing price with tight clustering
      // Use exponential distribution for realistic orderbook clustering
      const maxDistance = tickRangeMax - clearingMultiplier
      if (maxDistance > 0) {
        // Very tight clustering: most ticks immediately near clearing
        // Allow rare outliers (2% chance)
        const isOutlier = Math.random() < 0.02
        let distance: number

        if (isOutlier) {
          // Rare outlier: randomly distributed in range
          distance = Math.floor(Math.random() * maxDistance)
        } else {
          // Normal: very tightly clustered near clearing price
          // Use exponential with high lambda for tight clustering
          const lambda = 8.0 // Higher = tighter clustering
          const uniformRandom = Math.random()
          const exponentialRandom = -Math.log(1 - uniformRandom) / lambda
          // Scale to a smaller portion of maxDistance for tighter clustering
          // Most ticks will be within first 10-20% of range
          distance = Math.floor(Math.min(exponentialRandom, 0.3) * maxDistance)
        }

        randomMultiplier = Math.min(tickRangeMax, Math.floor(clearingMultiplier + distance))
      } else {
        randomMultiplier = Math.floor(clearingMultiplier)
      }
    } else {
      // Generate ticks below clearing price with uniform random distribution
      const minDistance = clearingMultiplier - tickRangeMin
      if (minDistance > 0) {
        const distance = Math.floor(Math.random() * minDistance)
        randomMultiplier = Math.max(tickRangeMin, Math.floor(clearingMultiplier - distance) - 1)
      } else {
        randomMultiplier = tickRangeMin
      }
    }

    // Ensure within valid range
    randomMultiplier = Math.max(tickRangeMin, Math.min(tickRangeMax, randomMultiplier))
    tickMultipliers.add(randomMultiplier)
  }

  // Generate distribution data with volume that decreases with distance from clearing price
  const distributionData = new Map<string, string>()

  for (const multiplier of tickMultipliers) {
    const tickValue = tickSizeBigInt * BigInt(multiplier)
    const tickValueBigInt = BigInt(tickValue)

    // Calculate distance from clearing price for volume weighting
    const distanceFromClearing = Math.abs(Number(tickValueBigInt - clearingPriceBigInt) / Number(tickSizeBigInt))

    // For bids at or above clearing: volume decreases with distance (orderbook style)
    // For bids below clearing: more random volume
    let randomVolume: bigint

    if (tickValueBigInt >= clearingPriceBigInt) {
      // At or above clearing: higher volume near clearing, exponentially decreasing
      // Base volume factor: 1.0 at clearing, decreasing to ~0.3 at far distances
      const distanceFactor = Math.exp(-distanceFromClearing * 0.05)
      // Add some randomness (±30%) while maintaining general trend
      const randomFactor = 0.7 + Math.random() * 0.6 // 0.7 to 1.3

      const volumeFactor = distanceFactor * randomFactor
      const scaledRange = Number(volumeRange) * volumeFactor
      const randomOffset = BigInt(Math.floor(scaledRange * Math.random()))
      const baseVolume = volumeMinBigInt + randomOffset

      // Ensure volume stays within bounds
      randomVolume = baseVolume > volumeMaxBigInt ? volumeMaxBigInt : baseVolume
    } else {
      // Below clearing: use more random distribution
      const randomRatio = Math.random()
      const randomOffset = BigInt(Math.floor(Number(volumeRange) * randomRatio))
      randomVolume = volumeMinBigInt + randomOffset
    }

    distributionData.set(tickValue.toString(), randomVolume.toString())
  }

  return distributionData
}

/**
 * Converts raw token value to human-readable decimal format
 * @example toHumanReadable("500000", 6) // "0.5"
 * @example toHumanReadable("100000000000000", 18) // "0.0001"
 */
export function toHumanReadable(value: string, decimals: number): string {
  try {
    const valueBigInt = BigInt(value)
    const divisor = BigInt(Math.pow(10, decimals))

    const wholePart = valueBigInt / divisor
    const fractionalPart = valueBigInt % divisor

    if (fractionalPart === 0n) {
      return wholePart.toString()
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0')
    // Remove trailing zeros
    const trimmed = fractionalStr.replace(/0+$/, '')

    return `${wholePart}.${trimmed}`
  } catch {
    return '0'
  }
}

/**
 * Converts human-readable decimal to raw token value
 * @example fromHumanReadable("0.5", 6) // "500000"
 * @example fromHumanReadable("0.0001", 18) // "100000000000000"
 */
export function fromHumanReadable(value: string, decimals: number): string {
  try {
    // Handle empty or invalid input
    if (!value || value === '' || value === '.') {
      return '0'
    }

    const [whole = '0', fractional = ''] = value.split('.')
    const paddedFractional = fractional.padEnd(decimals, '0').slice(0, decimals)
    const combined = (whole === '' ? '0' : whole) + paddedFractional
    return BigInt(combined || '0').toString()
  } catch {
    return '0'
  }
}

/**
 * Validates that tick count doesn't exceed available range
 */
export function validateTickCount(params: { tickCount: number; tickRangeMin: number; tickRangeMax: number }): boolean {
  const { tickCount, tickRangeMin, tickRangeMax } = params
  const availableTicks = tickRangeMax - tickRangeMin + 1
  return tickCount >= 1 && tickCount <= availableTicks
}

/**
 * Generates a descriptive name for a custom preset
 */
export function generatePresetName(params: CustomPresetParams): string {
  const config = BID_TOKEN_CONFIGS[params.bidToken]
  const minTick = toHumanReadable((BigInt(params.tickSize) * BigInt(params.tickRangeMin)).toString(), config.decimals)
  const maxTick = toHumanReadable((BigInt(params.tickSize) * BigInt(params.tickRangeMax)).toString(), config.decimals)

  return `${params.bidToken} | ${params.tickCount} ticks | $${minTick}-$${maxTick}`
}

/**
 * Creates BidTokenInfo from a bid token config for display purposes
 * Uses mock USD prices since this is only for displaying preset labels in the list
 * The actual chart rendering uses real prices from useBidTokenInfo
 */
export function getBidTokenInfoFromConfig(bidToken: 'USDC' | 'ETH'): {
  symbol: string
  decimals: number
  priceFiat: number
} {
  const config = BID_TOKEN_CONFIGS[bidToken]
  // Mock prices for display only - USDC is $1, ETH is $3000
  const mockPriceFiat = bidToken === 'USDC' ? 1 : 3000

  return {
    symbol: config.symbol,
    decimals: config.decimals,
    priceFiat: mockPriceFiat,
  }
}
