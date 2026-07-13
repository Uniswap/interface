import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { V2_DEFAULT_FEE_TIER } from 'uniswap/src/constants/pools'
import type { FeeData, PositionInfo } from 'uniswap/src/features/positions/types'

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

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
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
