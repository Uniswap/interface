import { getLocaleTimeString } from './utils'

describe('getLocaleTimeString', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2022-09-15T06:42:42.000')) // Thursday, September 15, 2022 6:42:42 AM
  })

  it('displays an event from one second ago', () => {
    const eventTime = 1663224161000 // Thursday, September 15, 2022 6:42:41 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('1 second ago')
  })

  it('displays an event from multiple seconds ago', () => {
    const eventTime = 1663224157000 // Thursday, September 15, 2022 6:42:37 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('5 seconds ago')
  })

  it('displays an event from one minute ago', () => {
    const eventTime = 1663224102000 // Thursday, September 15, 2022 6:41:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('1 minute ago')
  })

  it('displays an event from multiple minutes ago', () => {
    const eventTime = 1663223862000 // Thursday, September 15, 2022 6:37:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('5 minutes ago')
  })

  it('displays an event from one hour ago', () => {
    const eventTime = 1663220562000 // Thursday, September 15, 2022 5:42:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('1 hour ago')
  })

  it('displays an event from multiple hours ago', () => {
    const eventTime = 1663206162000 // Thursday, September 15, 2022 1:42:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('5 hours ago')
  })

  it('displays an event from one day ago', () => {
    const eventTime = 1663137762000 // Wednesday, September 14, 2022 6:42:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('1 day ago')
  })

  it('displays an event from multiple days ago', () => {
    const eventTime = 1663051362000 // Tuesday, September 13, 2022 6:42:42 AM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('09/13, 06:42am')
  })

  it('displays dayPeriod i.e. am, pm', () => {
    const eventTime = 1663094562000 // Tuesday, September 13, 2022 6:42:42 PM

    const localeTimeString = getLocaleTimeString(eventTime)

    expect(localeTimeString).toBe('09/13, 06:42pm')
  })
})
