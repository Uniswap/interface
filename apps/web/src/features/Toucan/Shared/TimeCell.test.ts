import { renderHook } from '@testing-library/react'
import { useTimeAgo } from '~/features/Toucan/Shared/TimeCell'

const NOW = Date.parse('2026-07-25T12:00:00Z')
const FIVE_MINUTES_MS = 5 * 60 * 1_000

function render(timestamp: string | number | undefined) {
  return renderHook(() => useTimeAgo(timestamp)).result.current
}

describe('useTimeAgo', () => {
  beforeEach(() => {
    // Explicit list: faking rAF/microtasks would deadlock React's scheduler.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] })
    vi.setSystemTime(NOW)
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('suffixes the age of a ms timestamp or an ISO string with "ago"', () => {
    expect(render(NOW - FIVE_MINUTES_MS)).toBe('5m ago')
    expect(render(new Date(NOW - FIVE_MINUTES_MS).toISOString())).toBe('5m ago')
  })

  it.each([
    ['undefined', undefined],
    ['an unparseable string', 'not-a-date'],
    ['NaN', Number.NaN],
  ])('renders a bare placeholder for %s', (_label, timestamp) => {
    expect(render(timestamp)).toBe('-')
  })
})
