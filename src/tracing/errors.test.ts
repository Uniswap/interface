import * as Sentry from '@sentry/react'

import { beforeSendAddMechanism, onerror, onunhandledrejection } from './errors'

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
}))

describe('beforeSendAddMechanism', () => {
  it.each(['onerror', 'onunhandledrejection'])(
    'adds mechanism to events with extra.mechanism set to "%s"',
    (mechanism) => {
      const event = {
        exception: { values: [{} as Record<'mechanism', unknown>] },
        extra: { mechanism },
      }
      beforeSendAddMechanism(event as Sentry.Event)
      expect(event.extra.mechanism).toBeUndefined()
      expect(event.exception.values[0].mechanism).toEqual({ handled: false, type: mechanism })
    }
  )

  it('does not add mechanism to other events', () => {
    const event = {
      exception: { values: [{} as Record<'mechanism', unknown>] },
      extra: { mechanism: 'onother' },
    }
    beforeSendAddMechanism(event as Sentry.Event)
    expect(event.extra.mechanism).toBe('onother')
    expect(event.exception.values[0].mechanism).toBeUndefined()
  })
})

describe('onerror', () => {
  it('calls Sentry.captureException with the error', () => {
    const error = new Error('test')
    onerror({} as Event, 'source', 1, 2, error)
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { extra: { mechanism: 'onerror' } })
  })

  it('calls Sentry.captureException with the event if there is no error', () => {
    const event = {}
    onerror({} as Event)
    expect(Sentry.captureException).toHaveBeenCalledWith(event, { extra: { mechanism: 'onerror' } })
  })
})

describe('onunhandledrejection', () => {
  it('calls Sentry.captureException with the reason', () => {
    const reason = new Error('test')
    onunhandledrejection({ reason })
    expect(Sentry.captureException).toHaveBeenCalledWith(reason, { extra: { mechanism: 'onunhandledrejection' } })
  })

  it('ignores eth_blockNumber exceptions', () => {
    const reason = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber', params: [] })
    })()
    onunhandledrejection({ reason })
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('ignores network change exceptions', () => {
    const reason = new Error('~~~underlying network changed~~~')
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    onunhandledrejection({ reason })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(reason)
  })
})
