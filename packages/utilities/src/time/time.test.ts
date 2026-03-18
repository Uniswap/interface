import { currentTimeInSeconds, inXMinutesUnix, isStale } from 'utilities/src/time/time'

vi.useFakeTimers()

describe('isStale', () => {
  it('returns true if lastUpdated is null', () => {
    expect(isStale(null, 1000)).toBe(true)
  })

  it('returns true if the lastUpdated timestamp is older than the staleTime', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const lastUpdated = now - 2000
    const staleTime = 1000

    expect(isStale(lastUpdated, staleTime)).toBe(true)
  })

  it('returns false if the lastUpdated timestamp is newer than the staleTime', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const lastUpdated = now - 500
    const staleTime = 1000

    expect(isStale(lastUpdated, staleTime)).toBe(false)
  })

  it('returns false if the lastUpdated timestamp is equal to the staleTime', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    const lastUpdated = now - 1000
    const staleTime = 1000

    expect(isStale(lastUpdated, staleTime)).toBe(false)
  })
})

describe('currentTimeInSeconds', () => {
  it('returns the current time in seconds', () => {
    const now = Date.now()
    vi.setSystemTime(now) // Ensures that dayjs and Date.now() return the same value

    expect(currentTimeInSeconds()).toBe(Math.floor(now / 1000))
  })
})

describe('inXMinutesUnix', () => {
  it('returns current time advanced by x minutes in seconds', () => {
    const now = Date.now()
    vi.setSystemTime(now) // Ensures that dayjs and Date.now() return the same value

    expect(inXMinutesUnix(5)).toBe(Math.floor((now + 5 * 60 * 1000) / 1000))
  })
})
