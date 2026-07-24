import { describe, expect, it } from 'vitest'
import { formatShortDateTime, formatTimestampToDate } from '~/features/Toucan/Auction/utils/formatting'

describe('formatTimestampToDate', () => {
  it('formats unix seconds as a localized date', () => {
    const date = new Date('2026-05-27T23:50:00Z')

    expect(formatTimestampToDate(BigInt(Math.floor(date.getTime() / 1000)))).toBe(
      date.toLocaleDateString(undefined, {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      }),
    )
  })
})

describe('formatShortDateTime', () => {
  it('formats chart timestamps in the requested local timezone', () => {
    const date = new Date('2026-06-04T15:30:00Z')

    expect(formatShortDateTime(date, { timeZone: 'UTC' })).toBe('06/04 15:30')
    expect(formatShortDateTime(date, { timeZone: 'America/New_York' })).toBe('06/04 11:30')
    expect(formatShortDateTime(date, { timeZone: 'Asia/Tokyo' })).toBe('06/05 00:30')
  })
})
