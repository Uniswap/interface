import { formatUnits } from 'viem'

/**
 * Q96 constant used in fixed-point arithmetic by the TWAP auction contracts
 * Price values from the contract are in Q96 format: price * 2^96
 */
export const Q96 = 79228162514264337593543950336n // 2^96

/**
 * Converts a Q96 fixed-point price value to decimal
 *
 * Q96 prices represent: actualPrice = q96Value / 2^96
 * The result is already in the token's base units (e.g., ETH, not wei)
 *
 * @param q96Value - Q96-encoded price value (as string or bigint)
 * @returns Decimal price in token base units
 */
export function fromQ96ToDecimal(q96Value: string | bigint): number {
  const valueBigInt = typeof q96Value === 'string' ? BigInt(q96Value) : q96Value

  // Multiply by a large scale factor for precision, then divide
  const SCALE = 1_000_000_000_000_000_000n // 10^18 for precision
  const scaled = (valueBigInt * SCALE) / Q96

  // Convert to number and scale back
  return Number(scaled) / Number(SCALE)
}

/**
 * Converts a Q96 fixed-point price to a decimal, adjusted for token decimals.
 * Uses bigint math internally (via q96ToPriceString) to preserve precision
 * when token decimals differ significantly (e.g., USDC 6 vs auction token 18).
 */
export function fromQ96ToDecimalWithTokenDecimals({
  q96Value,
  bidTokenDecimals,
  auctionTokenDecimals,
}: {
  q96Value: string | bigint
  bidTokenDecimals?: number
  auctionTokenDecimals?: number
}): number {
  // If decimals not provided, fall back to simple conversion
  if (bidTokenDecimals === undefined || auctionTokenDecimals === undefined) {
    return fromQ96ToDecimal(q96Value)
  }

  // Use q96ToPriceString for precision (bigint math), then parse to number
  const priceString = q96ToPriceString({
    q96Value,
    bidTokenDecimals,
    auctionTokenDecimals,
  })

  const parsed = Number.parseFloat(priceString)
  return Number.isFinite(parsed) ? parsed : 0
}

/**
 * Converts a Q96 fixed-point price value to raw token units (e.g. wei)
 *
 * @param q96Value - Q96-encoded price value (as string or bigint)
 * @param tokenDecimals - Token decimals to determine the precision of the raw amount
 * @returns Raw token amount (in smallest unit, e.g. wei)
 */
function q96ToRawAmount(q96Value: string | bigint, tokenDecimals: number): bigint {
  const valueBigInt = typeof q96Value === 'string' ? BigInt(q96Value) : q96Value
  const scale = 10n ** BigInt(tokenDecimals)

  return (valueBigInt * scale + Q96 / 2n) / Q96
}

// Exported for reuse in fixed-point display math (e.g., FDV calculations) without float round-trips.
export { q96ToRawAmount }

/**
 * Converts a raw token amount (in smallest units) to a Q96 fixed-point price value
 *
 * @param rawAmount - Raw token amount (in smallest unit, e.g. wei)
 * @param tokenDecimals - Token decimals to determine the precision of the raw amount
 * @returns Q96-encoded price value
 */
export function rawAmountToQ96(rawAmount: string | bigint, tokenDecimals: number): bigint {
  const rawBigInt = typeof rawAmount === 'string' ? BigInt(rawAmount) : rawAmount
  const scale = 10n ** BigInt(tokenDecimals)

  return (rawBigInt * Q96 + scale / 2n) / scale
}

/**
 * Converts a Q96 fixed-point price value to a decimal string with the token's precision
 *
 * @param q96Value - Q96-encoded price value (as string or bigint)
 * @param tokenDecimals - Token decimals to determine formatting precision
 * @returns Human-readable decimal string representation
 *
 * @deprecated Use q96ToPriceString for price conversions that need to account for
 * different bid/auction token decimals. This function only works correctly when
 * both tokens have the same number of decimals.
 */
export function q96ToDecimalString(q96Value: string | bigint, tokenDecimals: number): string {
  const rawAmount = q96ToRawAmount(q96Value, tokenDecimals)
  return formatUnits(rawAmount, tokenDecimals)
}

/**
 * Converts a Q96 price to a decimal string, properly accounting for both token decimals.
 *
 * Q96 prices represent: bid_token_raw / auction_token_raw
 * To get the price in bid token units per 1 auction token, we need to:
 * 1. Multiply Q96 by 10^auctionDecimals (to get bid_token_raw per 1 auction token)
 * 2. Divide by Q96 to un-scale
 * 3. Format as bid token units
 *
 * @param q96Value - Q96-encoded price value
 * @param bidTokenDecimals - Decimals of the bid token (e.g., 6 for USDC)
 * @param auctionTokenDecimals - Decimals of the auction token (typically 18)
 * @returns Human-readable price string (e.g., "0.101" for 0.101 USDC per token)
 */
export function q96ToPriceString({
  q96Value,
  bidTokenDecimals,
  auctionTokenDecimals = 18,
}: {
  q96Value: string | bigint
  bidTokenDecimals: number
  auctionTokenDecimals?: number
}): string {
  const valueBigInt = typeof q96Value === 'string' ? BigInt(q96Value) : q96Value

  // Q96 = (bid_raw / auction_raw) * 2^96
  // To get bid_raw per 1 auction token (10^auctionDecimals raw):
  // bid_raw = Q96 * 10^auctionDecimals / 2^96
  const auctionScale = 10n ** BigInt(auctionTokenDecimals)
  const rawBidAmount = (valueBigInt * auctionScale + Q96 / 2n) / Q96

  return formatUnits(rawBidAmount, bidTokenDecimals)
}

/**
 * Converts a price in bid token units to Q96, properly accounting for both token decimals.
 *
 * @param priceRaw - Price in raw bid token units (e.g., 101000 for 0.101 USDC with 6 decimals)
 * @param auctionTokenDecimals - Decimals of the auction token (typically 18)
 * @returns Q96-encoded price value
 */
export function priceToQ96WithDecimals({
  priceRaw,
  auctionTokenDecimals = 18,
}: {
  priceRaw: bigint
  auctionTokenDecimals?: number
}): bigint {
  // Q96 = (bid_raw / auction_raw) * 2^96
  // For price per 1 auction token: auction_raw = 10^auctionDecimals
  // Q96 = bid_raw * 2^96 / 10^auctionDecimals
  const auctionScale = 10n ** BigInt(auctionTokenDecimals)
  return (priceRaw * Q96 + auctionScale / 2n) / auctionScale
}

interface CalculateTickQ96Params {
  basePriceQ96: string
  tickSizeQ96: string
  tickOffset: number
}

/**
 * Calculates the Q96 string for a tick at a given offset from a base price
 * Uses BigInt arithmetic to maintain precision
 *
 * @param basePriceQ96 - Base price in Q96 format (typically floor price)
 * @param tickSizeQ96 - Tick size in Q96 format
 * @param tickOffset - Number of ticks from the base price
 * @returns Q96 string for the tick at the given offset
 */
export function calculateTickQ96(params: CalculateTickQ96Params): string {
  const { basePriceQ96, tickSizeQ96, tickOffset } = params
  const base = BigInt(basePriceQ96)
  const size = BigInt(tickSizeQ96)
  return (base + size * BigInt(tickOffset)).toString()
}
