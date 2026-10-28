import { act, renderHook } from '@testing-library/react'
import { useAbbreviatedTimeString } from '~/components/Table/utils/useAbbreviatedTimeString'

const NOW = Date.parse('2026-07-25T12:00:00Z')
const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function render(timestamp: number) {
  return renderHook(() => useAbbreviatedTimeString(timestamp))
}

describe('useAbbreviatedTimeString', () => {
  beforeEach(() => {
    // Explicit list: faking rAF/microtasks would deadlock React's scheduler.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([
    [42 * SECOND, '42s'],
    [5 * MINUTE, '5m'],
    [3 * HOUR, '3h'],
    [29 * DAY, '29d'],
    [30 * DAY, '1mo'],
    [359 * DAY, '11mo'],
  ])('renders %d ms ago as %s', (elapsedMs, expected) => {
    expect(render(NOW - elapsedMs).result.current).toBe(expected)
  })

  it('steps twelve 30-day months into years', () => {
    expect(render(NOW - 360 * DAY).result.current).toBe('1y')
    expect(render(NOW - 730 * DAY).result.current).toBe('2y')
  })

  it('clamps a future timestamp to 0s, never a negative age', () => {
    expect(render(NOW + 5 * SECOND).result.current).toBe('0s')
  })

  it('ticks as time passes', () => {
    const { result } = render(NOW - 58 * SECOND)
    expect(result.current).toBe('58s')

    act(() => {
      vi.advanceTimersByTime(2 * SECOND)
    })
    expect(result.current).toBe('1m')
  })
})
