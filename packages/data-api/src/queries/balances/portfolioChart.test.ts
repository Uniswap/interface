import { ConnectError } from '@connectrpc/connect'
import { MaxChallengeRetriesError, SessionReadyTimeoutError, SessionRecoveryFailedError } from '@universe/sessions'
import { describe, expect, it } from 'vitest'
import { type DataApiServiceClient } from '../../clients/createDataApiServiceClient'
import { getPortfolioChartQueryOptions } from './portfolioChart'

const client = {} as DataApiServiceClient

const TEST_EVM_ADDRESS = '0x1234567890123456789012345678901234567890'

function getRetry(): (failureCount: number, error: unknown) => boolean {
  const { retry } = getPortfolioChartQueryOptions(client, { input: { evmAddress: TEST_EVM_ADDRESS } })
  if (typeof retry !== 'function') {
    throw new Error('expected retry to be a function')
  }
  return retry as (failureCount: number, error: unknown) => boolean
}

describe(getPortfolioChartQueryOptions, () => {
  describe('retry', () => {
    it('retries once on SessionReadyTimeoutError', () => {
      const retry = getRetry()
      expect(retry(0, new SessionReadyTimeoutError(10_000))).toBe(true)
    })

    it('retries once on SessionRecoveryFailedError', () => {
      const retry = getRetry()
      expect(retry(0, new SessionRecoveryFailedError(new Error('401'), new Error('recover failed')))).toBe(true)
    })

    it('does not retry a second time on a repeated session-gate error', () => {
      const retry = getRetry()
      expect(retry(1, new SessionReadyTimeoutError(10_000))).toBe(false)
    })

    it('does not retry a terminal session recovery error', () => {
      const retry = getRetry()
      const terminalError = new MaxChallengeRetriesError(3, 4)
      expect(retry(0, new SessionRecoveryFailedError(new Error('401'), terminalError))).toBe(false)
    })

    it('does not retry on a non-session-gate error', () => {
      const retry = getRetry()
      expect(retry(0, new Error('boom'))).toBe(false)
    })

    it('retries once on a ConnectError-wrapped SessionReadyTimeoutError', () => {
      const retry = getRetry()
      const wrapped = ConnectError.from(new SessionReadyTimeoutError(10_000))
      expect(retry(0, wrapped)).toBe(true)
    })

    it('retries once on a ConnectError-wrapped SessionRecoveryFailedError', () => {
      const retry = getRetry()
      const wrapped = ConnectError.from(new SessionRecoveryFailedError(new Error('401'), new Error('recover failed')))
      expect(retry(0, wrapped)).toBe(true)
    })

    it('does not retry a second time on a repeated wrapped session-gate error', () => {
      const retry = getRetry()
      const wrapped = ConnectError.from(new SessionReadyTimeoutError(10_000))
      expect(retry(1, wrapped)).toBe(false)
    })

    it('does not retry a wrapped terminal session recovery error', () => {
      const retry = getRetry()
      const terminalError = new MaxChallengeRetriesError(3, 4)
      const wrapped = ConnectError.from(new SessionRecoveryFailedError(new Error('401'), terminalError))
      expect(retry(0, wrapped)).toBe(false)
    })
  })
})
