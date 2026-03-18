import { IChartApi, ISeriesApi, UTCTimestamp } from 'lightweight-charts'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MARKER_CONFIG } from '~/components/Toucan/Auction/BidDistributionChart/constants'
import {
  calculateTickTolerance,
  markerPositionsEqual,
} from '~/components/Toucan/Auction/BidDistributionChart/markers/markerPositions'
import { BidGroup, MarkerPosition } from '~/components/Toucan/Auction/BidDistributionChart/markers/types'
import { fromQ96ToDecimalWithTokenDecimals } from '~/components/Toucan/Auction/BidDistributionChart/utils/q96'
import { UserBid } from '~/components/Toucan/Auction/store/types'

interface ChartBar {
  tick: number
  amount: number
  tickQ96?: string
}

interface UseBidMarkerPositionsParams {
  userBids: UserBid[]
  bars: ChartBar[]
  tickSizeDecimal: number
  clearingPriceBigInt: bigint | null
  connectedWalletAddress?: string
  chartRef: React.RefObject<IChartApi | null>
  seriesRef: React.RefObject<ISeriesApi<'Custom'> | null>
  chartContainerRef: React.RefObject<HTMLDivElement | null>
  priceScaleFactor: number
  height: number
  getPlotDimensions: (container: HTMLDivElement | null, chart: IChartApi) => { left: number; width: number }
  bidTokenDecimals?: number
  auctionTokenDecimals?: number
  /** When in grouped mode, the number of ticks per group. Used to widen bid→bar matching tolerance. */
  groupSizeTicks?: number
}

/**
 * Groups user bids by their tick values, matching them to chart bars when possible.
 * Bids at similar price points (within tolerance) are grouped together.
 */
function groupBidsByTick({
  userBids,
  bars,
  tickSizeDecimal,
  bidTokenDecimals,
  auctionTokenDecimals,
  groupSizeTicks,
}: {
  userBids: UserBid[]
  bars: ChartBar[]
  tickSizeDecimal: number
  bidTokenDecimals?: number
  auctionTokenDecimals?: number
  /** When provided, uses a wider tolerance to match bids to grouped bars */
  groupSizeTicks?: number
}): BidGroup[] {
  if (userBids.length === 0) {
    return []
  }

  const baseTolerance = calculateTickTolerance(tickSizeDecimal)
  // In grouped mode, a grouped bar covers groupSizeTicks original ticks,
  // so widen the tolerance to match bids anywhere within the group's range
  const matchTolerance = groupSizeTicks && groupSizeTicks > 1 ? (groupSizeTicks * tickSizeDecimal) / 2 : baseTolerance
  const groups: BidGroup[] = []

  userBids.forEach((bid) => {
    // First try exact Q96 match (most accurate) - avoids floating-point precision issues
    const exactMatch = bars.find((bar) => bar.tickQ96 === bid.maxPrice)

    // Fall back to tolerance-based matching if no exact Q96 match
    const tickValue = fromQ96ToDecimalWithTokenDecimals({
      q96Value: bid.maxPrice,
      bidTokenDecimals,
      auctionTokenDecimals,
    })
    const matchingBar = exactMatch ?? bars.find((bar) => Math.abs(bar.tick - tickValue) < matchTolerance)
    const resolvedTick = matchingBar?.tick ?? tickValue

    // Use the wider tolerance for group lookup too so bids mapping to the same grouped bar merge
    let existingGroup = groups.find((candidate) => Math.abs(candidate.tick - resolvedTick) < matchTolerance)
    if (!existingGroup) {
      existingGroup = { tick: resolvedTick, bids: [] }
      groups.push(existingGroup)
    }

    existingGroup.bids.push(bid)
  })

  return groups.sort((left, right) => left.tick - right.tick)
}

/**
 * Custom hook for managing bid marker positions on the chart.
 * Calculates screen coordinates for user bid markers and handles position updates.
 *
 * @returns Array of marker positions and update function
 */
export function useBidMarkerPositions({
  userBids,
  bars,
  tickSizeDecimal,
  clearingPriceBigInt,
  connectedWalletAddress,
  chartRef,
  seriesRef,
  chartContainerRef,
  priceScaleFactor,
  height,
  getPlotDimensions,
  bidTokenDecimals,
  auctionTokenDecimals,
  groupSizeTicks,
}: UseBidMarkerPositionsParams) {
  const [markerPositions, setMarkerPositions] = useState<MarkerPosition[]>([])
  const markerPositionsRef = useRef<MarkerPosition[]>([])

  // Group bids by tick value
  const groupedUserBids = useMemo(
    () => groupBidsByTick({ userBids, bars, tickSizeDecimal, bidTokenDecimals, auctionTokenDecimals, groupSizeTicks }),
    [auctionTokenDecimals, bars, bidTokenDecimals, groupSizeTicks, tickSizeDecimal, userBids],
  )

  /**
   * Calculates marker positions synchronously based on current chart state.
   * Converts bid prices to screen coordinates and handles stacking.
   * Returns positions directly without updating state.
   */
  const calculateMarkerPositions = useCallback((): MarkerPosition[] => {
    const chart = chartRef.current
    const container = chartContainerRef.current

    if (!chart || !container || groupedUserBids.length === 0) {
      return []
    }

    const series = seriesRef.current
    if (!series) {
      return []
    }

    const { left: plotLeft, width: plotWidth } = getPlotDimensions(container, chart)
    const timeScale = chart.timeScale()
    const zeroCoordinate = series.priceToCoordinate(0)

    if (zeroCoordinate == null) {
      return []
    }

    const containerHeight = container.clientHeight || height
    const halfAvatar = MARKER_CONFIG.AVATAR_SIZE / 2
    const baseTolerance = calculateTickTolerance(tickSizeDecimal)
    const tolerance = groupSizeTicks && groupSizeTicks > 1 ? (groupSizeTicks * tickSizeDecimal) / 2 : baseTolerance

    if (
      !Number.isFinite(plotLeft) ||
      !Number.isFinite(plotWidth) ||
      plotWidth <= 0 ||
      !Number.isFinite(containerHeight) ||
      containerHeight <= 0
    ) {
      return markerPositionsRef.current
    }

    const positions: MarkerPosition[] = []
    let hasValidCoordinate = false

    groupedUserBids.forEach((group) => {
      const timeValue = Math.round(group.tick * priceScaleFactor) as UTCTimestamp
      const xCoordinate = timeScale.timeToCoordinate(timeValue)

      if (xCoordinate == null || !Number.isFinite(xCoordinate)) {
        return
      }

      hasValidCoordinate = true
      const matchedBar = bars.find((bar) => Math.abs(bar.tick - group.tick) < tolerance)
      const barAmount = matchedBar?.amount ?? 0
      const barCoordinate = series.priceToCoordinate(barAmount) ?? zeroCoordinate
      if (!Number.isFinite(barCoordinate)) {
        return
      }

      const anchorY = Math.min(barCoordinate, zeroCoordinate)
      const baseTop = anchorY + MARKER_CONFIG.AVATAR_BAR_OFFSET - MARKER_CONFIG.AVATAR_SIZE

      const plotCenter = plotLeft + xCoordinate
      const leftEdge = plotCenter - halfAvatar
      const rightEdge = plotCenter + halfAvatar
      const plotRight = plotLeft + plotWidth

      if (rightEdge < plotLeft || leftEdge > plotRight) {
        return
      }

      const top = baseTop
      const maxTop = Math.max(containerHeight - MARKER_CONFIG.AVATAR_SIZE, 0)
      const clampedTop = Math.min(Math.max(top, 0), maxTop)

      let isInRange = false
      if (clearingPriceBigInt !== null && group.bids.length > 0) {
        try {
          isInRange = group.bids.some((bid) => BigInt(bid.maxPrice) >= clearingPriceBigInt)
        } catch {
          isInRange = false
        }
      }

      positions.push({
        id: `${group.tick}`,
        left: plotCenter,
        top: clampedTop,
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- connectedWalletAddress can be undefined
        address: connectedWalletAddress ?? group.bids[0]?.walletId ?? '',
        bids: group.bids,
        isInRange,
      })
    })

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- hasValidCoordinate is set inside forEach callback
    if (!hasValidCoordinate) {
      return markerPositionsRef.current
    }

    positions.sort((left, right) => (left.left === right.left ? left.top - right.top : left.left - right.left))

    return positions
  }, [
    bars,
    clearingPriceBigInt,
    connectedWalletAddress,
    getPlotDimensions,
    groupSizeTicks,
    groupedUserBids,
    height,
    priceScaleFactor,
    tickSizeDecimal,
    chartRef,
    seriesRef,
    chartContainerRef,
  ])

  /**
   * Updates marker positions in state.
   * Should be called after chart has been updated and is ready.
   */
  const updateMarkerPositions = useCallback(() => {
    const nextPositions = calculateMarkerPositions()

    if (!markerPositionsEqual(markerPositionsRef.current, nextPositions)) {
      markerPositionsRef.current = nextPositions
      setMarkerPositions(nextPositions)
    }
  }, [calculateMarkerPositions])

  /**
   * Clears all marker positions immediately.
   * Used when chart is being recreated to prevent stale positions from rendering.
   */
  const clearMarkerPositions = useCallback(() => {
    markerPositionsRef.current = []
    setMarkerPositions([])
  }, [])

  /**
   * Calculates and immediately updates marker positions synchronously.
   * Use this when you need positions calculated in the same tick.
   */
  const updateMarkerPositionsSync = useCallback(() => {
    const nextPositions = calculateMarkerPositions()
    markerPositionsRef.current = nextPositions
    setMarkerPositions(nextPositions)
  }, [calculateMarkerPositions])

  // Update positions when dependencies change
  useEffect(() => {
    updateMarkerPositions()
  }, [updateMarkerPositions])

  return { markerPositions, updateMarkerPositions, updateMarkerPositionsSync, clearMarkerPositions }
}
