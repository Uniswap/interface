import * as Sentry from '@sentry/react'

import { beforeSendAddMechanism, onUnhandledRejection } from './errors'

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
}))

describe('beforeSendAddMechanism', () => {
  it.each(['onunhandledrejection'])('adds mechanism to events with extra.mechanism set to "%s"', (mechanism) => {
    const event = {
      exception: { values: [{} as Record<'mechanism', unknown>] },
      extra: { mechanism },
    }
    beforeSendAddMechanism(event as Sentry.Event)
    expect(event.extra.mechanism).toBeUndefined()
    expect(event.exception.values[0].mechanism).toEqual({ handled: false, type: mechanism })
  })

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

describe('onUnhandledRejection', () => {
  it('calls Sentry.captureException with the reason', () => {
    const reason = new Error('test')
    onUnhandledRejection({ reason })
    expect(Sentry.captureException).toHaveBeenCalledWith(reason, { extra: { mechanism: 'onunhandledrejection' } })
  })

  it('ignores eth_blockNumber exceptions', () => {
    const reason = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber', params: [] })
    })()
    onUnhandledRejection({ reason })
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('ignores network change exceptions', () => {
    const reason = new Error('~~~underlying network changed~~~')
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    onUnhandledRejection({ reason })
    expect(Sentry.captureException).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(reason)
  })
})
