import * as Sentry from '@sentry/react'

import { onerror, onunhandledrejection } from './errors'

jest.mock('@sentry/react', () => ({
  captureException: jest.fn(),
}))

describe('onerror', () => {
  it('calls Sentry.captureException with the error', () => {
    const error = new Error('test')
    onerror({} as Event, 'source', 1, 2, error)
    expect(Sentry.captureException).toHaveBeenCalledWith(error, { tags: { handled: 'no', mechanism: 'onerror' } })
  })

  it('calls Sentry.captureException with the event if there is no error', () => {
    const event = {}
    onerror({} as Event)
    expect(Sentry.captureException).toHaveBeenCalledWith(event, { tags: { handled: 'no', mechanism: 'onerror' } })
  })
})

describe('onunhandledrejection', () => {
  it('calls Sentry.captureException with the reason', () => {
    const reason = new Error('test')
    onunhandledrejection({ reason })
    expect(Sentry.captureException).toHaveBeenCalledWith(reason, {
      tags: { handled: 'no', mechanism: 'onunhandledrejection' },
    })
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
