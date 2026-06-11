import { isEquityMarketOffHours } from 'uniswap/src/features/rwa/equityMarketHours'

describe('isEquityMarketOffHours', () => {
  it('returns false on a weekday during regular trading hours', () => {
    // Wednesday, Jan 10 2024, noon ET
    expect(isEquityMarketOffHours(new Date('2024-01-10T12:00:00-05:00'))).toBe(false)
  })

  it('returns true on a weekday before the 9:30am ET open', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-10T09:29:00-05:00'))).toBe(true)
  })

  it('returns false at the 9:30am ET open', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-10T09:30:00-05:00'))).toBe(false)
  })

  it('returns false just before the 4:00pm ET close', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-10T15:59:00-05:00'))).toBe(false)
  })

  it('returns true at the 4:00pm ET close', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-10T16:00:00-05:00'))).toBe(true)
  })

  it('returns true overnight on a weekday', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-10T03:00:00-05:00'))).toBe(true)
  })

  it('returns true throughout Saturday', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-13T03:00:00-05:00'))).toBe(true)
    expect(isEquityMarketOffHours(new Date('2024-01-13T12:00:00-05:00'))).toBe(true)
    expect(isEquityMarketOffHours(new Date('2024-01-13T23:00:00-05:00'))).toBe(true)
  })

  it('returns true throughout Sunday', () => {
    expect(isEquityMarketOffHours(new Date('2024-01-14T12:00:00-05:00'))).toBe(true)
  })

  it('respects daylight saving time (EDT, UTC-4)', () => {
    // Wednesday, Jul 10 2024 — summer, EDT
    expect(isEquityMarketOffHours(new Date('2024-07-10T09:29:00-04:00'))).toBe(true)
    expect(isEquityMarketOffHours(new Date('2024-07-10T09:30:00-04:00'))).toBe(false)
    expect(isEquityMarketOffHours(new Date('2024-07-10T16:00:00-04:00'))).toBe(true)
  })
})
