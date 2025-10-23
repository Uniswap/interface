import { areSameDays } from 'utilities/src/time/date'

const date1 = new Date(946702869000) // 2000/1/1, 1:01AM ET
const date2 = new Date(946704600000) // 2000/1/1, 1:30AM ET
const date3 = new Date(946789140000) // 2000/1/1, 11:59PM ET
const date4 = new Date(946789260000) // 2000/1/2, 1:01AM ET

describe(areSameDays, () => {
  it('same if within an hour on the same day', () => {
    expect(areSameDays(date1, date2)).toBe(true)
  })

  it('same 23 hours apart on the same day', () => {
    expect(areSameDays(date2, date3)).toBe(true)
  })

  it('different if on the border of the day but only a second apart', () => {
    expect(areSameDays(date3, date4)).toBe(false)
  })
})
