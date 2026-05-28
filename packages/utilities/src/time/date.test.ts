import { areSameDays } from 'utilities/src/time/date'

describe(areSameDays, () => {
  it('same if within an hour on the same day', () => {
    const date1 = new Date(2000, 0, 1, 1, 1) // Jan 1, 2000, 1:01 AM local time
    const date2 = new Date(2000, 0, 1, 1, 30) // Jan 1, 2000, 1:30 AM local time
    expect(areSameDays(date1, date2)).toBe(true)
  })

  it('same 23 hours apart on the same day', () => {
    const date1 = new Date(2000, 0, 1, 1, 0) // Jan 1, 2000, 1:00 AM local time
    const date2 = new Date(2000, 0, 1, 23, 59) // Jan 1, 2000, 11:59 PM local time
    expect(areSameDays(date1, date2)).toBe(true)
  })

  it('different if on the border of the day but only a second apart', () => {
    const date1 = new Date(2000, 0, 1, 23, 59, 59) // Jan 1, 2000, 11:59:59 PM local time
    const date2 = new Date(2000, 0, 2, 0, 0, 0) // Jan 2, 2000, 12:00:00 AM local time
    expect(areSameDays(date1, date2)).toBe(false)
  })
})
