import { TickMarkType, UTCTimestamp } from 'lightweight-charts'
import ms from 'ms'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import {
  ChartType,
  DataQuality,
  checkDataQuality,
  formatTickMarks,
  getCurrentUTCTimestamp,
} from '~/components/Charts/utils'

describe('getCurrentUTCTimestamp', () => {
  it('returns whole integer seconds, not a fractional value', () => {
    // Date.now() is millisecond-precision; lightweight-charts UTCTimestamp must be an integer second.
    vi.spyOn(Date, 'now').mockReturnValue(1781279676509)

    const result = getCurrentUTCTimestamp()

    expect(result).toBe(1781279676)
    expect(Number.isInteger(result)).toBe(true)
  })
})

describe('checkDataQuality', () => {
  const NOW = 1_700_000_000_000
  const makeData = (lastPointAgeMs: number) => [
    { time: (NOW - lastPointAgeMs - 2000) / 1000 },
    { time: (NOW - lastPointAgeMs - 1000) / 1000 },
    { time: (NOW - lastPointAgeMs) / 1000 },
  ]

  beforeEach(() => {
    vi.spyOn(Date, 'now').mockReturnValue(NOW)
  })

  it.each([HistoryDuration.Week, HistoryDuration.Month, HistoryDuration.Year])(
    'does not flag the price chart as stale for a %s-duration bucket several hours old',
    (duration) => {
      // Regression: the raw last historical bucket for longer durations is naturally coarser/older than
      // 15 minutes even when data is fresh at that duration's resolution (e.g. if the live-append no-ops).
      const data = makeData(ms('6h'))

      const result = checkDataQuality({ data, chartType: ChartType.PRICE, duration })

      expect(result).toBe(DataQuality.VALID)
    },
  )

  it.each([0, 1, 2])('flags a series of %i points as invalid before any staleness check', (pointCount) => {
    const data = makeData(0).slice(0, pointCount)

    const result = checkDataQuality({
      data,
      chartType: ChartType.PRICE,
      duration: HistoryDuration.Day,
    })

    expect(result).toBe(DataQuality.INVALID)
  })

  it('flags the price chart as stale once a duration-appropriate threshold is exceeded', () => {
    const data = makeData(ms('31d'))

    const result = checkDataQuality({ data, chartType: ChartType.PRICE, duration: HistoryDuration.Year })

    expect(result).toBe(DataQuality.STALE)
  })
})

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
