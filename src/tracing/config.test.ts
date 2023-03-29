import { ErrorEvent } from '@sentry/types'

import { beforeSend } from './config'

describe('beforeSend', () => {
  const ERROR = {} as ErrorEvent
  it('propagates an error', () => {
    expect(beforeSend(ERROR, {})).toBe(ERROR)
  })

  it('omits eth_blockNumber failures', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(beforeSend(ERROR, { originalException })).toBe(null)
  })
})
