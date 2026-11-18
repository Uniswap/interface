import { TickMarkType, type UTCTimestamp } from 'lightweight-charts'
import { formatPriceChartTickMark } from '~/components/Charts/PriceChart/utils'
import { formatTickMarks } from '~/components/Charts/utils'

vi.mock('~/components/Charts/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/Charts/utils')>()),
  formatTickMarks: vi.fn(() => 'label'),
}))

// Nov 1 00:00 UTC: still Oct 31 (month 9) west of UTC, already Nov 1 (month 10) east of it. The test worker's
// timezone can't be switched, so the local calendar is stubbed instead.
const NOV_1_UTC = (Date.UTC(2026, 10, 1) / 1000) as UTCTimestamp

function formatWithLocalDate({ month, year }: { month: number; year: number }, type: TickMarkType): TickMarkType {
  vi.spyOn(Date.prototype, 'getMonth').mockReturnValue(month)
  vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(year)
  formatPriceChartTickMark(NOV_1_UTC, type, 'en-US')
  return vi.mocked(formatTickMarks).mock.lastCall?.[1] as TickMarkType
}

describe('formatPriceChartTickMark', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('labels a UTC month mark as its day where it is still the previous month locally', () => {
    expect(formatWithLocalDate({ month: 9, year: 2026 }, TickMarkType.Month)).toBe(TickMarkType.DayOfMonth)
  })

  it('keeps the month label where the local month matches', () => {
    expect(formatWithLocalDate({ month: 10, year: 2026 }, TickMarkType.Month)).toBe(TickMarkType.Month)
  })

  it('labels a UTC year mark as its day where it is still the previous year locally', () => {
    const jan1 = (Date.UTC(2027, 0, 1) / 1000) as UTCTimestamp
    vi.spyOn(Date.prototype, 'getFullYear').mockReturnValue(2026)
    formatPriceChartTickMark(jan1, TickMarkType.Year, 'en-US')
    expect(vi.mocked(formatTickMarks).mock.lastCall?.[1]).toBe(TickMarkType.DayOfMonth)
  })

  it('passes other mark types through', () => {
    expect(formatWithLocalDate({ month: 9, year: 2026 }, TickMarkType.Time)).toBe(TickMarkType.Time)
  })
})
