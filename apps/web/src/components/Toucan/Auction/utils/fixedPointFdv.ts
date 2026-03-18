import { logger } from 'utilities/src/logger/logger'
import { Q96 } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'

function pow10(exp: number): bigint {
  if (exp <= 0) {
    return 1n
  }
  return 10n ** BigInt(exp)
}

function absBigInt(x: bigint): bigint {
  return x < 0n ? -x : x
}

/**
 * Compute FDV in *bid-token raw units* (e.g., wei for ETH, 6-decimals for USDC).
 *
 * `priceQ96` is Q96 for price in bid-token raw units per auction-token raw unit.
 * Raw FDV = (priceQ96 / Q96) * totalSupply_auctionToken_raw
 *
 * The formula is computed directly as (priceQ96 * totalSupplyRaw + Q96/2) / Q96
 * to preserve precision. Q96 prices already encode the decimal relationship
 * between tokens, so no separate decimal adjustment is needed.
 */
export function computeFdvBidTokenRaw({
  priceQ96,
  totalSupplyRaw,
  auctionTokenDecimals,
}: {
  priceQ96: string | bigint
  bidTokenDecimals?: number
  totalSupplyRaw: string | bigint
  auctionTokenDecimals?: number
}): bigint {
  if (!auctionTokenDecimals) {
    return 0n
  }

  const priceQ96BigInt = typeof priceQ96 === 'string' ? BigInt(priceQ96) : priceQ96
  const supplyRaw = typeof totalSupplyRaw === 'string' ? BigInt(totalSupplyRaw) : totalSupplyRaw

  // Direct formula: FDV = (priceQ96 × totalSupplyRaw + Q96/2) / Q96
  // Q96 prices already encode the decimal relationship between tokens,
  // so no separate decimal adjustment is needed.
  return (priceQ96BigInt * supplyRaw + Q96 / 2n) / Q96
}

export function computeFractionFromRaw({
  numeratorRaw,
  denominatorRaw,
}: {
  numeratorRaw: bigint
  denominatorRaw: bigint
}): number {
  if (denominatorRaw <= 0n || numeratorRaw <= 0n) {
    return 0
  }
  if (numeratorRaw >= denominatorRaw) {
    return 1
  }

  // Use a fixed scale to keep within safe number range.
  const SCALE = 1_000_000n
  const scaled = (numeratorRaw * SCALE) / denominatorRaw
  return Number(scaled) / Number(SCALE)
}

export function formatCompactFromRaw({
  raw,
  decimals,
  maxFractionDigits = 2,
  minFractionDigits = 0,
  suffixes = [
    { exp: 12, suffix: 'T' },
    { exp: 9, suffix: 'B' },
    { exp: 6, suffix: 'M' },
    { exp: 3, suffix: 'K' },
    { exp: 0, suffix: '' },
  ],
}: {
  raw: bigint
  decimals: number
  maxFractionDigits?: number
  minFractionDigits?: number
  suffixes?: ReadonlyArray<{ exp: number; suffix: string }>
}): string {
  try {
    const sign = raw < 0n ? '-' : ''
    const absRaw = absBigInt(raw)

    if (absRaw === 0n) {
      return '0'
    }

    const fracScale = pow10(maxFractionDigits)

    let chosen = suffixes[suffixes.length - 1]!
    for (const s of suffixes) {
      const threshold = pow10(decimals + s.exp)
      if (absRaw >= threshold) {
        chosen = s
        break
      }
    }

    const denom = pow10(decimals + chosen.exp)
    const scaled = (absRaw * fracScale + denom / 2n) / denom

    const intPart = scaled / fracScale
    const fracPart = scaled % fracScale

    if (maxFractionDigits === 0) {
      return `${sign}${intPart.toString()}${chosen.suffix}`
    }

    let frac = fracPart.toString().padStart(maxFractionDigits, '0')

    // Trim trailing zeros, but keep at least minFractionDigits.
    while (frac.length > minFractionDigits && frac.endsWith('0')) {
      frac = frac.slice(0, -1)
    }

    const dot = frac.length > 0 ? '.' : ''
    return `${sign}${intPart.toString()}${dot}${frac}${chosen.suffix}`
  } catch (error) {
    logger.error(error, {
      tags: { file: 'fixedPointFdv', function: 'formatCompactFromRaw' },
      extra: { raw: raw.toString(), decimals },
    })
    return '-'
  }
}

/**
 * Formats a raw token amount with symbol, with smart decimal precision.
 *
 * Decimal places (always fixed, with trailing zeros):
 * - Abbreviated (K/M/B/T): exactly 3 decimals (e.g., "1.200M ETH", "1.234M USDC")
 * - Non-abbreviated stablecoins: exactly 2 decimals (e.g., "1234.00 USDC")
 * - Non-abbreviated other tokens: exactly 5 decimals (e.g., "1234.50000 ETH")
 *
 * Sub-threshold handling:
 * - Stablecoins: shows "<0.01" instead of "0.00"
 * - Other tokens: shows "<0.00001" instead of "0.00000"
 */
export function formatTokenAmountWithSymbol({
  raw,
  decimals,
  symbol,
  isStablecoin = false,
}: {
  raw: bigint
  decimals: number
  symbol: string
  isStablecoin?: boolean
}): string {
  const absRaw = raw < 0n ? -raw : raw

  // Determine if the value will be abbreviated (has K/M/B/T suffix)
  // Threshold for K suffix is 10^(decimals+3) = 1000 tokens
  const abbreviationThreshold = 10n ** BigInt(decimals + 3)
  const willBeAbbreviated = absRaw >= abbreviationThreshold

  // Abbreviated values (K/M/B/T): always use 3 decimal places
  // Non-abbreviated stablecoins: 2 decimal places for cleaner display
  // Non-abbreviated other tokens: 5 decimal places for precision
  const maxFractionDigits = willBeAbbreviated ? 3 : isStablecoin ? 2 : 5

  // Check if value is non-zero but below display threshold
  // For stablecoins: 0.01, for others: 0.00001
  const thresholdExponent = isStablecoin ? 2 : 5
  const thresholdRaw = 10n ** BigInt(Math.max(0, decimals - thresholdExponent))
  const isSubThreshold = raw > 0n && raw < thresholdRaw

  if (isSubThreshold) {
    const thresholdDisplay = isStablecoin ? '0.01' : '0.00001'
    return `<${thresholdDisplay} ${symbol}`
  }

  // minFractionDigits ensures we don't drop trailing zeros:
  // - Abbreviated: always 3 decimals (e.g., "1.200M" not "1.2M")
  // - Non-abbreviated stablecoins: always 2 decimals (e.g., "1234.00")
  // - Non-abbreviated others: always 5 decimals (e.g., "1234.50000")
  const minFractionDigits = willBeAbbreviated ? 3 : isStablecoin ? 2 : 5

  const formatted = formatCompactFromRaw({
    raw,
    decimals,
    maxFractionDigits,
    minFractionDigits,
  })
  return `${formatted} ${symbol}`
}

/**
 * Converts a raw integer amount into a JS number *approximately*, using only a limited
 * number of significant digits. This avoids `Number(formatUnits(...))` precision loss
 * for very large values while still allowing us to use existing locale/fiat formatters.
 */
export function approximateNumberFromRaw({
  raw,
  decimals,
  significantDigits = 15,
}: {
  raw: bigint
  decimals: number
  significantDigits?: number
}): number {
  if (raw === 0n) {
    return 0
  }

  const sign = raw < 0n ? -1 : 1
  const absRaw = absBigInt(raw)
  const rawStr = absRaw.toString()

  // Convert raw to an approximate decimal string with limited significant digits.
  const take = Math.max(1, Math.min(rawStr.length, significantDigits))
  const head = rawStr.slice(0, take)
  const exponent = rawStr.length - take - decimals

  // Value ≈ head * 10^exponent
  const approx = Number(head) * 10 ** exponent
  return sign * approx
}
