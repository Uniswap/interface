import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useEffect, useRef } from 'react'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

interface PoolsPositionCounts {
  total: number
  inRange: number
  outOfRange: number
  closed: number
}

/** Counts positions by range status. Reflects only the passed (rendered) set, not any backend total. */
export function getPoolsPositionCounts(positions: PositionInfo[]): PoolsPositionCounts {
  let inRange = 0
  let outOfRange = 0
  let closed = 0
  for (const position of positions) {
    if (position.status === PositionStatus.IN_RANGE) {
      inRange++
    } else if (position.status === PositionStatus.OUT_OF_RANGE) {
      outOfRange++
    } else if (position.status === PositionStatus.CLOSED) {
      closed++
    }
  }
  return { total: positions.length, inRange, outOfRange, closed }
}

/**
 * Emits {@link UniswapEventName.PoolsPositionsReport} for the pools positions a user has actually seen.
 * Only fires while `enabled` (e.g. the Pools tab is the active tab) — the tab component stays mounted
 * across the home screen, so without this gate it would report on startup before the user opens it.
 * Re-fires as pagination loads more rows (the counts change), so each emit mirrors the rendered set.
 * The dedupe persists across tab switches, so re-opening the tab with an unchanged set is suppressed -
 * it only re-emits when the composition actually changed since the last emit.
 * `pagesLoaded` + `has_more` let analytics reconstruct scroll depth and whether the set was complete.
 */
export function usePoolsPositionsReport({
  positions,
  pagesLoaded,
  hasMore,
  isLoading,
  enabled,
}: {
  positions: PositionInfo[]
  pagesLoaded: number
  hasMore: boolean
  isLoading: boolean
  enabled: boolean
}): void {
  const trace = useTrace()
  const traceRef = useRef(trace)
  traceRef.current = trace

  // Dedupe by value: polling refetches give a new `positions` array even when the counts are
  // unchanged, so only emit when the reported values actually differ from the last emit.
  const lastSignatureRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!enabled || isLoading) {
      return
    }

    const counts = getPoolsPositionCounts(positions)
    const signature = `${counts.total}-${counts.inRange}-${counts.outOfRange}-${counts.closed}-${pagesLoaded}-${hasMore}`
    if (signature === lastSignatureRef.current) {
      return
    }
    lastSignatureRef.current = signature

    sendAnalyticsEvent(UniswapEventName.PoolsPositionsReport, {
      total_positions: counts.total,
      in_range_count: counts.inRange,
      out_of_range_count: counts.outOfRange,
      closed_count: counts.closed,
      pages_loaded: pagesLoaded,
      has_more: hasMore,
      ...traceRef.current,
    })
  }, [enabled, isLoading, positions, pagesLoaded, hasMore])
}
