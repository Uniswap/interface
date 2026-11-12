import { TickMarkType, UTCTimestamp } from 'lightweight-charts'
import { formatTickMarks } from '~/components/Charts/utils'

describe('formatTickMarks', () => {
  // 2024-01-15T12:00:00Z — midday UTC so the calendar day is stable across test-runner timezones
  const time = 1705320000 as UTCTimestamp

  it('formats month tick marks in the given locale', () => {
    expect(formatTickMarks(time, TickMarkType.Month, 'en-US')).toBe('Jan 2024')
    expect(formatTickMarks(time, TickMarkType.Month, 'es-ES')).toBe('ene 2024')
    expect(formatTickMarks(time, TickMarkType.Month, 'zh-Hans')).toBe('2024年1月')
  })

  it('formats day-of-month tick marks in the given locale', () => {
    expect(formatTickMarks(time, TickMarkType.DayOfMonth, 'en-US')).toBe('Jan 15')
    expect(formatTickMarks(time, TickMarkType.DayOfMonth, 'es-ES')).toBe('15 ene')
  })
})
