import * as Sentry from '@sentry/react'

import { onUnhandledRejection } from './errors'

jest.mock('@sentry/react', () => {
  return { getCurrentHub: jest.fn() }
})

const captureException = jest.fn()
beforeEach(() => (Sentry.getCurrentHub as jest.Mock).mockReturnValue({ captureException }))

describe('onUnhandledRejection', () => {
  it('calls Sentry.captureException', () => {
    const reason = new Error('test')
    onUnhandledRejection({ reason })
    expect(Sentry.getCurrentHub().captureException).toHaveBeenCalledWith(reason, {
      originalException: reason,
      data: { mechanism: { handled: false, type: 'onunhandledrejection' } },
    })
  })

  it('ignores eth_blockNumber exceptions', () => {
    const reason = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber', params: [] })
    })()
    onUnhandledRejection({ reason })
    expect(Sentry.getCurrentHub().captureException).not.toHaveBeenCalled()
  })

  it('ignores network change exceptions', () => {
    const reason = new Error('~~~underlying network changed~~~')
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    onUnhandledRejection({ reason })
    expect(Sentry.getCurrentHub().captureException).not.toHaveBeenCalled()
    expect(console.warn).toHaveBeenCalledWith(reason)
  })
})
