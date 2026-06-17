import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { describe, expect, it } from 'vitest'
import { didUserReject } from '~/utils/swapErrorToUserReadableMessage'

describe('didUserReject', () => {
  it('detects top-level EIP-1193 rejection code', () => {
    expect(didUserReject({ code: 4001 })).toBe(true)
  })

  it('detects stringified JSON-RPC rejection code', () => {
    expect(didUserReject({ code: '4001', message: 'rejected' })).toBe(true)
  })

  it('detects rejection nested on error.cause (common viem / structured errors)', () => {
    const err = new Error('An internal error was received')
    ;(err as Error & { cause: { code: number; message: string } }).cause = {
      code: 4001,
      message: 'User rejected the request.',
    }
    expect(didUserReject(err)).toBe(true)
  })

  it('detects rejection on TransactionStepFailedError.originalError', () => {
    const original = Object.assign(new Error('User rejected'), { code: 4001 })
    const wrapped = new TransactionStepFailedError({
      message: 'swapTransaction failed during auctionLaunch',
      step: { type: TransactionStepType.SwapTransaction } as never,
      originalError: original,
    })
    expect(didUserReject(wrapped)).toBe(true)
  })

  it('returns false for unrelated failures', () => {
    expect(didUserReject(new Error('execution reverted'))).toBe(false)
  })

  it('does not treat Rainbow-style rejection as matched when "request" and "reject" appear only in different fields', () => {
    expect(
      didUserReject({
        shortMessage: 'GET request',
        message: 'reject handler failed',
      }),
    ).toBe(false)
  })

  it('detects Rainbow-style rejection when both patterns appear in one message field', () => {
    expect(didUserReject({ message: 'User rejected the request.' })).toBe(true)
  })
})
