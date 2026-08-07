import { renderHook } from '@testing-library/react'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useAuctionTimeRemaining } from '~/features/Toucan/Auction/hooks/useAuctionTimeRemaining'

const mockUseSharedMachineTimeMs = vi.fn<(updateInterval: number) => number>()
vi.mock('~/hooks/useMachineTime', () => ({
  useSharedMachineTimeMs: (updateInterval: number) => mockUseSharedMachineTimeMs(updateInterval),
}))

const mockUseAbbreviatedTimeString = vi.fn<(timestamp: number) => string>()
vi.mock('~/components/Table/utils/useAbbreviatedTimeString', () => ({
  useAbbreviatedTimeString: (timestamp: number) => mockUseAbbreviatedTimeString(timestamp),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => (params ? `${key} ${Object.values(params).join(' ')}` : key),
  }),
}))

const START_S = 10_000n
const END_S = 13_600n // 1h auction
const startMs = Number(START_S) * 1000
const endMs = Number(END_S) * 1000

function renderAtTime(
  nowMs: number,
  params: Partial<Parameters<typeof useAuctionTimeRemaining>[0]> = {},
): ReturnType<typeof renderHook<ReturnType<typeof useAuctionTimeRemaining>, void>> {
  mockUseSharedMachineTimeMs.mockReturnValue(nowMs)
  return renderHook(() =>
    useAuctionTimeRemaining({ startBlockTimestamp: START_S, endBlockTimestamp: END_S, ...params }),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockUseAbbreviatedTimeString.mockReturnValue('24m')
})

describe('useAuctionTimeRemaining', () => {
  it('subscribes to the shared machine clock at a 1s interval', () => {
    renderAtTime(startMs)
    expect(mockUseSharedMachineTimeMs).toHaveBeenCalledWith(ONE_SECOND_MS)
  })

  it('returns empty data when timestamps are missing', () => {
    const { result } = renderAtTime(startMs, { startBlockTimestamp: undefined })
    expect(result.current).toEqual({
      durationString: undefined,
      timeString: undefined,
      progressPercentage: 0,
      phase: undefined,
    })
  })

  it('counts down to startBlockTimestamp before the auction starts', () => {
    const { result } = renderAtTime(startMs - 120_000)
    expect(result.current.phase).toBe('notStarted')
    expect(result.current.timeString).toBe('2m 0s')
    expect(result.current.durationString).toBe('toucan.auction.startingIn 2m 0s')
    expect(result.current.progressPercentage).toBe(0)
  })

  it('floors the countdown to whole seconds', () => {
    const { result } = renderAtTime(startMs - 90_500)
    expect(result.current.timeString).toBe('1m 30s')
  })

  it('counts down to endBlockTimestamp while the auction is live', () => {
    // 900s of 3600s elapsed -> 25%, 2700s remaining
    const { result } = renderAtTime(startMs + 900_000)
    expect(result.current.phase).toBe('live')
    expect(result.current.timeString).toBe('45m 0s')
    expect(result.current.durationString).toBe('45m 0s')
    expect(result.current.progressPercentage).toBe(25)
  })

  it('is live from exactly startBlockTimestamp', () => {
    const { result } = renderAtTime(startMs)
    expect(result.current.phase).toBe('live')
    expect(result.current.progressPercentage).toBe(0)
  })

  it('counts down to the pre-bid end while keeping the end-of-auction durationString', () => {
    const preBidEnd = START_S + 1000n
    const { result } = renderAtTime(startMs + 900_000, { preBidEndBlockTimestamp: preBidEnd })
    expect(result.current.phase).toBe('preBid')
    expect(result.current.timeString).toBe('1m 40s') // 100s to pre-bid end
    expect(result.current.durationString).toBe('45m 0s') // still the auction-end countdown
  })

  it('leaves the live phase once the pre-bid window has passed', () => {
    const preBidEnd = START_S + 1000n
    const { result } = renderAtTime(startMs + 1_000_000, { preBidEndBlockTimestamp: preBidEnd })
    expect(result.current.phase).toBe('live')
  })

  it('reports completion recency from exactly endBlockTimestamp', () => {
    const { result } = renderAtTime(endMs)
    expect(result.current.phase).toBe('completed')
    expect(result.current.progressPercentage).toBe(100)
    expect(result.current.durationString).toBe('toucan.auction.completedAgo 24m')
    expect(result.current.timeString).toBe('toucan.auction.timeAgo 24m')
    expect(mockUseAbbreviatedTimeString).toHaveBeenCalledWith(endMs)
  })

  it('advances phase when the shared clock ticks', () => {
    mockUseSharedMachineTimeMs.mockReturnValue(startMs - 1000)
    const { result, rerender } = renderHook(() =>
      useAuctionTimeRemaining({ startBlockTimestamp: START_S, endBlockTimestamp: END_S }),
    )
    expect(result.current.phase).toBe('notStarted')

    mockUseSharedMachineTimeMs.mockReturnValue(startMs + 1000)
    rerender()
    expect(result.current.phase).toBe('live')

    mockUseSharedMachineTimeMs.mockReturnValue(endMs + 1000)
    rerender()
    expect(result.current.phase).toBe('completed')
  })
})
