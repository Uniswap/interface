import { Currency, Price, Token } from '@uniswap/sdk-core'
import {
  encodeSqrtRatioX96,
  FeeAmount,
  nearestUsableTick,
  priceToClosestTick,
  TICK_SPACINGS,
  TickMath,
} from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { convertScientificNotationToNumber } from 'utilities/src/format/convertScientificNotation'

// Full Range Tick constants for V3
// These are the maximum tick values aligned to each fee tier's tickSpacing
export const FULL_RANGE_TICKS = {
  [FeeAmount.LOWEST]: { min: -887272, max: 887272 }, // 0.01%
  [FeeAmount.LOW]: { min: -887270, max: 887270 }, // 0.05%
  [FeeAmount.MEDIUM]: { min: -887220, max: 887220 }, // 0.3%
  [FeeAmount.HIGH]: { min: -887200, max: 887200 }, // 1%
} as const

/**
 * Get full range tick configuration for a specific fee tier
 * @param feeTier - Fee tier enum value (e.g., 3000 for 0.3%)
 * @returns Object containing min and max ticks for full range
 */
export function getFullRangeConfig(feeTier: FeeAmount): { min: number; max: number } {
  const config = FULL_RANGE_TICKS[feeTier]
  if (!config) {
    throw new Error(`Unsupported fee tier: ${feeTier}`)
  }
  return config
}

/**
 * Sort tokens by address (required for Uniswap V3)
 * @param tokenA - First token address
 * @param tokenB - Second token address
 * @returns Sorted token addresses [token0, token1] where token0.address < token1.address
 */
export function sortTokens(tokenA: string, tokenB: string): [string, string] {
  return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA]
}

/**
 * Check if a chain requires full range mode for V3 liquidity
 * @param chainId - Chain ID to check
 * @returns true if the chain requires full range mode
 */
export function isFullRangeModeChain(chainId: number | undefined): boolean {
  if (!chainId) {
    return false
  }
  // HashKey Chain and HashKey Testnet require full range mode for V3
  return chainId === UniverseChainId.HashKey || chainId === UniverseChainId.HashKeyTestnet
}

export function tryParsePrice<T extends Currency>({
  baseToken,
  quoteToken,
  value,
}: {
  baseToken?: T
  quoteToken?: T
  value?: string
}): Price<T, T> | undefined {
  if (!baseToken || !quoteToken || !value) {
    return undefined
  }

  // Convert scientific notation to decimal format
  const decimalValue = convertScientificNotationToNumber(value)

  if (!decimalValue.match(/^\d*\.?\d*$/)) {
    return undefined
  }

  const [whole, fraction] = decimalValue.split('.')

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const decimals = fraction?.length ?? 0
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const withoutDecimals = JSBI.BigInt((whole ?? '') + (fraction ?? ''))

  return new Price(
    baseToken,
    quoteToken,
    JSBI.multiply(JSBI.BigInt(10 ** decimals), JSBI.BigInt(10 ** baseToken.decimals)),
    JSBI.multiply(withoutDecimals, JSBI.BigInt(10 ** quoteToken.decimals)),
  )
}

export function tryParseTick({
  baseToken,
  quoteToken,
  feeAmount,
  value,
}: {
  baseToken?: Token | null | undefined
  quoteToken?: Token | null | undefined
  feeAmount?: FeeAmount
  value?: string
}): number | undefined {
  if (!baseToken || !quoteToken || !feeAmount || !value) {
    return undefined
  }

  const price = tryParsePrice({ baseToken, quoteToken, value })

  if (!price) {
    return undefined
  }

  let tick: number

  // check price is within min/max bounds, if outside return min/max
  const sqrtRatioX96 = encodeSqrtRatioX96(price.numerator, price.denominator)

  if (JSBI.greaterThanOrEqual(sqrtRatioX96, TickMath.MAX_SQRT_RATIO)) {
    tick = TickMath.MAX_TICK
  } else if (JSBI.lessThanOrEqual(sqrtRatioX96, TickMath.MIN_SQRT_RATIO)) {
    tick = TickMath.MIN_TICK
  } else {
    // this function is agnostic to the base, will always return the correct tick
    tick = priceToClosestTick(price)
  }

  return nearestUsableTick(tick, TICK_SPACINGS[feeAmount])
}
