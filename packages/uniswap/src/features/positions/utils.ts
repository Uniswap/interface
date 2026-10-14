import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { ChainId, Protocols } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { type Fraction, Percent } from '@uniswap/sdk-core'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import type { FeeData, PositionInfo } from 'uniswap/src/features/positions/types'

// The liquidity service's `ChainId` enum carries the same numeric values as UniverseChainId (and the
// data-api chainId) but is a distinct nominal type. Validate membership and narrow once — a chain the
// liquidity service doesn't model is dropped rather than reinterpreted into a bogus enum value.
export function toLiquidityChainId(chainId: number | undefined): ChainId | undefined {
  return chainId !== undefined && chainId in ChainId ? (chainId as ChainId) : undefined
}

/**
 * Persisted liquidity-service data rehydrates protobuf enums as their name ("V2"/"V3"/"V4");
 * normalize back to the numeric enum.
 */
export function normalizeLiquidityServiceProtocols(version: Protocols | string | undefined): Protocols | undefined {
  return typeof version === 'string' ? Protocols[version as keyof typeof Protocols] : version
}

export function protocolVersionToLiquidityServiceProtocols(version?: ProtocolVersion): Protocols | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return Protocols.V2
    case ProtocolVersion.V3:
      return Protocols.V3
    case ProtocolVersion.V4:
      return Protocols.V4
    default:
      return undefined
  }
}

export function liquidityServiceProtocolsToProtocolVersion(version: Protocols | string | undefined): ProtocolVersion {
  switch (normalizeLiquidityServiceProtocols(version)) {
    case Protocols.V2:
      return ProtocolVersion.V2
    case Protocols.V3:
      return ProtocolVersion.V3
    case Protocols.V4:
      return ProtocolVersion.V4
    default:
      return ProtocolVersion.UNSPECIFIED
  }
}

/**
 * Stable key combining poolId + tokenId + chainId. Use for React keys and dedup maps
 * across position lists. `tokenId` is optional on V2, so coerced to '' when absent.
 */
export function getPositionKey(position: Pick<PositionInfo, 'poolId' | 'tokenId' | 'chainId'>): string {
  return `${position.poolId}-${position.tokenId ?? ''}-${position.chainId}`
}

/** Returns a new array with Closed positions moved to the end, preserving the order of the rest (stable). */
export function sortPositionsByStatusClosedLast(positions: PositionInfo[]): PositionInfo[] {
  return [...positions].sort(
    (a, b) => Number(a.status === PositionStatus.CLOSED) - Number(b.status === PositionStatus.CLOSED),
  )
}

/** Filters positions to the given statuses, then moves Closed positions to the end (stable). */
export function filterAndSortPositions(positions: PositionInfo[], statuses: PositionStatus[]): PositionInfo[] {
  return sortPositionsByStatusClosedLast(positions.filter((position) => statuses.includes(position.status)))
}

/**
 * Whether the position is held via the PermissionedPositionManager. Only V4 positions carry the
 * flag; pass this as `permissioned` on liquidity-service requests so they route to the correct PM.
 */
export function getIsPermissioned(position: PositionInfo): boolean | undefined {
  return position.version === ProtocolVersion.V4 ? position.isPermissioned : undefined
}

/** Lowercase protocol label as it appears in URLs and explore payloads (`/positions/v3/...`). */
export type ProtocolVersionLabel = 'v2' | 'v3' | 'v4'

export function getProtocolVersionLabel(version: ProtocolVersion): ProtocolVersionLabel | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

/**
 * `part`'s share of `total` as a `Percent`, or `undefined` when `total` is not positive.
 *
 * Divides the exact fractions rather than the `quotient` integers. `CurrencyAmount.quotient` floors,
 * and both a `Price.quote()` result and a `CurrencyAmount` sum keep a denominator, so a total worth
 * less than one raw unit of its currency — dust, a low-decimals token, or a pool whose served price
 * sits at the edge of the tick range — floors to `0`. `new Percent(_, 0)` is built silently and then
 * throws "[big.js] Division by zero" on the first `toFixed`.
 *
 * The `undefined` return is the other half of that: `Fraction.divide` puts the divisor's *numerator*
 * in the denominator, so a non-positive `total` would rebuild the very zero denominator this exists
 * to prevent. Returning `undefined` rather than throwing makes a caller that forgets to check
 * `total` a type error here instead of a `toFixed` crash somewhere downstream.
 */
export function getExactSharePercent(part: Fraction, total: Fraction): Percent | undefined {
  if (!total.greaterThan(0)) {
    return undefined
  }
  const share = part.asFraction.divide(total.asFraction)
  return new Percent(share.numerator, share.denominator)
}

/** Caller passes a localized label for the dynamic-fee case so this util stays i18n-agnostic. */
export function getFeeLabel({
  version,
  feeTier,
  dynamicLabel,
}: {
  version: ProtocolVersion
  feeTier?: FeeData
  dynamicLabel: string
}): string | undefined {
  if (feeTier?.isDynamic) {
    return dynamicLabel
  }
  if (feeTier) {
    return `${feeTier.feeAmount / BIPS_BASE}%`
  }
  if (version === ProtocolVersion.V2) {
    return `${V2_DEFAULT_FEE_TIER / BIPS_BASE}%`
  }
  return undefined
}
