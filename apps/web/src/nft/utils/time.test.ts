import { i18n } from '@lingui/core'
import { DEFAULT_LOCALE } from 'constants/locales'
import catalog from 'locales/en-US'
import { en } from 'make-plural'

import { timeUntil } from './time'

describe('timeUntil', () => {
  const originalDate = new Date('2023-06-01T00:00:00.000Z')
  i18n.load({
    [DEFAULT_LOCALE]: catalog.messages,
  })
  i18n.loadLocaleData({
    [DEFAULT_LOCALE]: { plurals: en },
  })
  i18n.activate(DEFAULT_LOCALE)

  test('returns undefined when date is in the past', () => {
    const pastDate = new Date('2022-01-01T00:00:00.000Z')
    expect(timeUntil(pastDate, originalDate)).toBeUndefined()
  })

  test('returns the correct time until in months', () => {
    const futureDate = new Date('2023-09-01T00:00:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('3 months')
  })

  test('returns the correct time until in weeks', () => {
    const futureDate = new Date('2023-06-20T00:00:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('2 weeks')
  })

  test('returns the correct time until in days', () => {
    const futureDate = new Date('2023-06-03T12:00:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('2 days')
  })

  test('returns the correct time untwil in hours', () => {
    const futureDate = new Date('2023-06-01T05:00:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('5 hours')
  })

  test('returns the correct time until in minutes', () => {
    const futureDate = new Date('2023-06-01T00:05:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('5 minutes')
  })

  test('returns the correct time until in seconds', () => {
    const futureDate = new Date('2023-06-01T00:00:05.000Z')

    expect(timeUntil(futureDate, originalDate)).toEqual('5 seconds')
  })

  test('returns 99+ months for large intervals', () => {
    const futureDate = new Date('2123-01-01T00:00:00.000Z')
    expect(timeUntil(futureDate, originalDate)).toEqual('99+ months')
  })
})
