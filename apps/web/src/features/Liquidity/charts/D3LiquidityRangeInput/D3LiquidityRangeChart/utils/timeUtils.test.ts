import { getTimeFormat } from '~/features/Liquidity/charts/D3LiquidityRangeInput/D3LiquidityRangeChart/utils/timeUtils'

const TIME_OF_DAY_LABEL = /^\w{3} \d{2}:\d{2}$/ // e.g. "Mon 13:00"
const MONTH_DAY_LABEL = /^\w{3} \d{2}$/ // e.g. "Jan 01"
const MONTH_YEAR_LABEL = /^\w{3} \d{4}$/ // e.g. "Jan 2024"

function extentOfDays(days: number): [Date, Date] {
  const end = new Date(2026, 5, 12, 12, 0, 0)
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000)
  return [start, end]
}

describe('getTimeFormat', () => {
  it('uses time-of-day labels when the data spans a day', () => {
    const [start, end] = extentOfDays(1)
    expect(getTimeFormat([start, end])(start)).toMatch(TIME_OF_DAY_LABEL)
  })

  it('uses time-of-day labels up to a two-day span', () => {
    const [start, end] = extentOfDays(2)
    expect(getTimeFormat([start, end])(start)).toMatch(TIME_OF_DAY_LABEL)
  })

  it('uses month-day labels for a week of data', () => {
    const [start, end] = extentOfDays(7)
    expect(getTimeFormat([start, end])(start)).toMatch(MONTH_DAY_LABEL)
  })

  it('uses month-day labels for a two-week-old pool even when a longer duration is selected', () => {
    // Regression test for LP-908: "All time" on a young pool must not produce month/year labels
    const [start, end] = extentOfDays(14)
    expect(getTimeFormat([start, end])(start)).toMatch(MONTH_DAY_LABEL)
  })

  it('uses month-day labels for a month of data', () => {
    const [start, end] = extentOfDays(30)
    expect(getTimeFormat([start, end])(start)).toMatch(MONTH_DAY_LABEL)
  })

  it('uses month-year labels for a year of data', () => {
    const [start, end] = extentOfDays(365)
    expect(getTimeFormat([start, end])(start)).toMatch(MONTH_YEAR_LABEL)
  })

  it('uses month-year labels for multi-year data', () => {
    const [start, end] = extentOfDays(4 * 365)
    expect(getTimeFormat([start, end])(start)).toMatch(MONTH_YEAR_LABEL)
  })

  it('uses time-of-day labels for a single data point (zero span)', () => {
    const date = new Date(2026, 5, 12, 12, 0, 0)
    expect(getTimeFormat([date, date])(date)).toMatch(TIME_OF_DAY_LABEL)
  })
})
