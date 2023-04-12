import { ErrorEvent } from '@sentry/types'

import { filterKnownErrors } from './errors'

describe('filterKnownErrors', () => {
  const ERROR = {} as ErrorEvent
  it('propagates an error', () => {
    expect(filterKnownErrors(ERROR, {})).toBe(ERROR)
  })

  it('filters block number polling errors', () => {
    const originalException = new (class extends Error {
      requestBody = JSON.stringify({ method: 'eth_blockNumber' })
    })()
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters network change errors', () => {
    const originalException = new Error('underlying network changed')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })

  it('filters user rejected request errors', () => {
    const originalException = new Error('user rejected transaction')
    expect(filterKnownErrors(ERROR, { originalException })).toBe(null)
  })
})
