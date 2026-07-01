import { renderHook } from '@testing-library/react'
import { PositionStatus } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import {
  getPoolsPositionCounts,
  usePoolsPositionsReport,
} from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import type { PositionInfo } from 'uniswap/src/features/positions/types'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { Mock } from 'vitest'

vi.mock('uniswap/src/features/telemetry/send')
vi.mock('utilities/src/telemetry/trace/TraceContext', async (importOriginal) => ({
  ...(await importOriginal<typeof import('utilities/src/telemetry/trace/TraceContext')>()),
  useTrace: () => ({}),
}))

const position = (status: PositionStatus): PositionInfo => ({ status }) as unknown as PositionInfo

describe(getPoolsPositionCounts, () => {
  it('counts positions by range status and totals the set', () => {
    const counts = getPoolsPositionCounts([
      position(PositionStatus.IN_RANGE),
      position(PositionStatus.IN_RANGE),
      position(PositionStatus.OUT_OF_RANGE),
      position(PositionStatus.CLOSED),
    ])

    expect(counts).toEqual({ total: 4, inRange: 2, outOfRange: 1, closed: 1 })
  })

  it('returns all zeros for an empty set', () => {
    expect(getPoolsPositionCounts([])).toEqual({ total: 0, inRange: 0, outOfRange: 0, closed: 0 })
  })

  it('still counts a position in the total when its status is outside the known buckets', () => {
    const counts = getPoolsPositionCounts([position(PositionStatus.IN_RANGE), position(PositionStatus.UNSPECIFIED)])

    expect(counts).toEqual({ total: 2, inRange: 1, outOfRange: 0, closed: 0 })
  })
})

describe(usePoolsPositionsReport, () => {
  const mockSendAnalyticsEvent = sendAnalyticsEvent as Mock

  beforeEach(() => {
    mockSendAnalyticsEvent.mockClear()
  })

  it('fires once with the rendered counts and pagination state', () => {
    const positions = [
      position(PositionStatus.IN_RANGE),
      position(PositionStatus.OUT_OF_RANGE),
      position(PositionStatus.CLOSED),
    ]

    renderHook(() =>
      usePoolsPositionsReport({ positions, pagesLoaded: 1, hasMore: true, isLoading: false, enabled: true }),
    )

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenCalledWith(UniswapEventName.PoolsPositionsReport, {
      total_positions: 3,
      in_range_count: 1,
      out_of_range_count: 1,
      closed_count: 1,
      pages_loaded: 1,
      has_more: true,
    })
  })

  it('does not fire while the first page is still loading', () => {
    renderHook(() =>
      usePoolsPositionsReport({
        positions: [position(PositionStatus.IN_RANGE)],
        pagesLoaded: 0,
        hasMore: true,
        isLoading: true,
        enabled: true,
      }),
    )

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('does not fire while disabled, then fires once when it becomes enabled', () => {
    const positions = [position(PositionStatus.IN_RANGE)]
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: { positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: false },
    })

    expect(mockSendAnalyticsEvent).not.toHaveBeenCalled()

    rerender({ positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: true })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire when the tab is re-opened with an unchanged set', () => {
    const positions = [position(PositionStatus.IN_RANGE)]
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: { positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: true },
    })

    rerender({ positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: false })
    rerender({ positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: true })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('re-fires on re-open when the set changed while the tab was inactive', () => {
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: {
        positions: [position(PositionStatus.IN_RANGE)],
        pagesLoaded: 1,
        hasMore: false,
        isLoading: false,
        enabled: true,
      },
    })

    rerender({
      positions: [position(PositionStatus.IN_RANGE)],
      pagesLoaded: 1,
      hasMore: false,
      isLoading: false,
      enabled: false,
    })
    // A position flipped out of range while the tab was inactive -> re-open emits.
    rerender({
      positions: [position(PositionStatus.OUT_OF_RANGE)],
      pagesLoaded: 1,
      hasMore: false,
      isLoading: false,
      enabled: true,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('re-fires with updated counts when pagination loads more positions', () => {
    const firstPage = [position(PositionStatus.IN_RANGE)]
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: { positions: firstPage, pagesLoaded: 1, hasMore: true, isLoading: false, enabled: true },
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
    expect(mockSendAnalyticsEvent).toHaveBeenLastCalledWith(
      UniswapEventName.PoolsPositionsReport,
      expect.objectContaining({ total_positions: 1, pages_loaded: 1, has_more: true }),
    )

    const secondPage = [...firstPage, position(PositionStatus.OUT_OF_RANGE), position(PositionStatus.CLOSED)]
    rerender({ positions: secondPage, pagesLoaded: 2, hasMore: false, isLoading: false, enabled: true })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(2)
    expect(mockSendAnalyticsEvent).toHaveBeenLastCalledWith(
      UniswapEventName.PoolsPositionsReport,
      expect.objectContaining({
        total_positions: 3,
        out_of_range_count: 1,
        closed_count: 1,
        pages_loaded: 2,
        has_more: false,
      }),
    )
  })

  it('does not re-fire when re-rendered with the same positions reference', () => {
    const positions = [position(PositionStatus.IN_RANGE)]
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: { positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: true },
    })

    rerender({ positions, pagesLoaded: 1, hasMore: false, isLoading: false, enabled: true })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('does not re-fire when a refetch yields a new array with unchanged counts', () => {
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: {
        positions: [position(PositionStatus.IN_RANGE)],
        pagesLoaded: 1,
        hasMore: false,
        isLoading: false,
        enabled: true,
      },
    })

    // New array reference (as React Query produces on a poll), same counts -> suppressed.
    rerender({
      positions: [position(PositionStatus.IN_RANGE)],
      pagesLoaded: 1,
      hasMore: false,
      isLoading: false,
      enabled: true,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('re-fires when a position changes range status without changing the total', () => {
    const { rerender } = renderHook((props) => usePoolsPositionsReport(props), {
      initialProps: {
        positions: [position(PositionStatus.IN_RANGE)],
        pagesLoaded: 1,
        hasMore: false,
        isLoading: false,
        enabled: true,
      },
    })

    rerender({
      positions: [position(PositionStatus.OUT_OF_RANGE)],
      pagesLoaded: 1,
      hasMore: false,
      isLoading: false,
      enabled: true,
    })

    expect(mockSendAnalyticsEvent).toHaveBeenCalledTimes(2)
    expect(mockSendAnalyticsEvent).toHaveBeenLastCalledWith(
      UniswapEventName.PoolsPositionsReport,
      expect.objectContaining({ total_positions: 1, in_range_count: 0, out_of_range_count: 1 }),
    )
  })
})
