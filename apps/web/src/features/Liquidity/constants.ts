import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  PositionStatus as LiquidityPositionStatus,
  RangeStatus,
} from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { Level } from '@uniswap/client-unirpc-v2/dist/uniswap/unirpc/v2/service_pb'
import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { UniverseChainId } from '@universe/chains'
import type { PositionsLifecycleFilter, PositionsRangeFilter } from 'uniswap/src/features/telemetry/types'

/**
 * Urgency for LP client-side fallback gas estimates (used only when the liquidity service
 * response carries no `gasFee`). Pinned to URGENT: the liquidity service estimates LP gas
 * at urgent speed, and the legacy client fallback (Statsig 'general' strategy) defaults to
 * `URGENT_GAS_STRATEGY`. Reaches /EstimateGas as `urgencies` only while
 * `FeatureFlags.GasFeeOverrides` is enabled — otherwise `fetchGasFeeQuery` keeps the
 * legacy gas-strategies path.
 */
export const LP_GAS_URGENCY = { level: Level.URGENT }

interface FeeDataWithChain {
  feeData: {
    isDynamic: boolean
    feeAmount: FeeAmount
    tickSpacing: number
  }
  supportedChainIds?: UniverseChainId[]
}

export const defaultFeeTiers: Record<FeeAmount, FeeDataWithChain> = {
  [FeeAmount.LOWEST]: {
    feeData: { feeAmount: FeeAmount.LOWEST, tickSpacing: TICK_SPACINGS[FeeAmount.LOWEST], isDynamic: false },
  },
  [FeeAmount.LOW_200]: {
    feeData: { feeAmount: FeeAmount.LOW_200, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_200], isDynamic: false },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_300]: {
    feeData: { feeAmount: FeeAmount.LOW_300, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_300], isDynamic: false },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW_400]: {
    feeData: { feeAmount: FeeAmount.LOW_400, tickSpacing: TICK_SPACINGS[FeeAmount.LOW_400], isDynamic: false },
    supportedChainIds: [UniverseChainId.Base],
  },
  [FeeAmount.LOW]: {
    feeData: { feeAmount: FeeAmount.LOW, tickSpacing: TICK_SPACINGS[FeeAmount.LOW], isDynamic: false },
  },
  [FeeAmount.MEDIUM]: {
    feeData: { feeAmount: FeeAmount.MEDIUM, tickSpacing: TICK_SPACINGS[FeeAmount.MEDIUM], isDynamic: false },
  },
  [FeeAmount.HIGH]: {
    feeData: { feeAmount: FeeAmount.HIGH, tickSpacing: TICK_SPACINGS[FeeAmount.HIGH], isDynamic: false },
  },
} as const

export const LP_POSITION_PROTOCOL_VERSIONS = [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
export const LP_POSITION_STATUS_FILTER_OPTIONS = [
  PositionStatus.IN_RANGE,
  PositionStatus.OUT_OF_RANGE,
  PositionStatus.CLOSED,
]

export const DEFAULT_LP_POSITION_PROTOCOL_FILTER = [...LP_POSITION_PROTOCOL_VERSIONS]
export const DEFAULT_LP_POSITION_STATUS_FILTER = [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE]

// V2-endpoint (liquidity-service) lifecycle filter. The request's `statuses` field carries lifecycle
// (OPEN/CLOSED) ONLY — spam/hidden is not a lifecycle status, so it isn't a user-facing option here;
// hidden positions are surfaced via the client-side visibility partition (Redux-hidden). `in_range`/
// `out_of_range` aren't part of this filter either — they're a refinement of open concentrated
// positions carried by the separate `range_statuses` field.
export const V2_POSITION_STATUS_OPTIONS = ['open', 'closed'] as const
export type V2PositionStatusFilter = (typeof V2_POSITION_STATUS_OPTIONS)[number]
export const DEFAULT_V2_POSITION_STATUS_FILTER: V2PositionStatusFilter[] = ['open']

// Whether the V2 lifecycle dropdown or the in/out-of-range chips deviate from their defaults. Both
// filter server-side now, so an empty result under an active filter means "nothing matches" rather
// than "wallet is empty" — callers use this to keep the control bar mounted instead of swapping in an
// empty/discovery view (which would strand the filter with no way to change it back).
export function hasActiveV2StatusFilter(
  statusFilter: V2PositionStatusFilter[],
  rangeFilter: PositionStatus[],
): boolean {
  const lifecycleActive = hasActiveV2LifecycleFilter(statusFilter)
  const rangeActive =
    rangeFilter.length !== DEFAULT_LP_POSITION_STATUS_FILTER.length ||
    !DEFAULT_LP_POSITION_STATUS_FILTER.every((status) => rangeFilter.includes(status))
  return lifecycleActive || rangeActive
}

export function hasActiveV2LifecycleFilter(statusFilter: V2PositionStatusFilter[]): boolean {
  return (
    statusFilter.length !== DEFAULT_V2_POSITION_STATUS_FILTER.length ||
    !DEFAULT_V2_POSITION_STATUS_FILTER.every((status) => statusFilter.includes(status))
  )
}

// Companion to hasActiveV2StatusFilter for the protocol-version filter: a non-default version
// selection also makes an empty result "nothing matches this filter" rather than "wallet is empty".
export function hasActiveV2VersionFilter(versionFilter: ProtocolVersion[]): boolean {
  return (
    versionFilter.length !== DEFAULT_LP_POSITION_PROTOCOL_FILTER.length ||
    !DEFAULT_LP_POSITION_PROTOCOL_FILTER.every((version) => versionFilter.includes(version))
  )
}

// Single boundary that builds the liquidity-service lifecycle + range request. Every caller goes
// through here, so the invariants live in one place: never emit an empty `statuses` (which the BE
// reads as "no lifecycle filter"), and a single range chip always narrows via `range_statuses`.
// The BE intersects `range_statuses` with `statuses`; closed positions match no range bucket, so
// an active chip intentionally drops closed rows even when Closed is selected.
export function v2StatusFilterToRequestStatuses(
  statusFilter: V2PositionStatusFilter[],
  rangeFilter: PositionStatus[],
): { statuses: LiquidityPositionStatus[]; rangeStatuses: RangeStatus[] } {
  const statuses: LiquidityPositionStatus[] = []
  const rangeStatuses: RangeStatus[] = []
  const open = statusFilter.includes('open')
  const closed = statusFilter.includes('closed')
  if (open) {
    statuses.push(LiquidityPositionStatus.OPEN)
  }
  if (closed) {
    statuses.push(LiquidityPositionStatus.CLOSED)
  }
  // Empty selection would serialize to an unfiltered request; fall back to the full lifecycle set.
  if (statuses.length === 0) {
    statuses.push(LiquidityPositionStatus.OPEN, LiquidityPositionStatus.CLOSED)
  }
  const inRange = rangeFilter.includes(PositionStatus.IN_RANGE)
  const outOfRange = rangeFilter.includes(PositionStatus.OUT_OF_RANGE)
  // A single range chip narrows via range_statuses; both (or neither) selected leaves lifecycle coarse.
  if (inRange && !outOfRange) {
    rangeStatuses.push(RangeStatus.IN_RANGE)
  } else if (outOfRange && !inRange) {
    rangeStatuses.push(RangeStatus.OUT_OF_RANGE)
  }
  return { statuses, rangeStatuses }
}

export function deriveActiveRangeFilter(statusFilter: PositionStatus[]): PositionsRangeFilter {
  if (statusFilter.length === 1 && statusFilter[0] === PositionStatus.IN_RANGE) {
    return 'in_range'
  }
  if (statusFilter.length === 1 && statusFilter[0] === PositionStatus.OUT_OF_RANGE) {
    return 'out_of_range'
  }
  return 'all'
}

export function deriveLifecycleFilter(statusFilter: V2PositionStatusFilter[]): PositionsLifecycleFilter {
  const open = statusFilter.includes('open')
  const closed = statusFilter.includes('closed')
  // Neither checked serializes to an unfiltered request (see v2StatusFilterToRequestStatuses), so
  // both and neither mean the full lifecycle set.
  if (open === closed) {
    return 'all'
  }
  return open ? 'open' : 'closed'
}
