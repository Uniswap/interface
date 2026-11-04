import { Code, ConnectError } from '@connectrpc/connect'
import { FetchError } from '@universe/api'
import { TFunction } from 'i18next'
import { TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { describe, expect, it } from 'vitest'
import {
  didUserReject,
  isBlockedAccountError,
  swapErrorToUserReadableMessage,
} from '~/utils/swapErrorToUserReadableMessage'

const t = ((key: string) => key) as unknown as TFunction

// Built the way createFetchClient builds it: the status on the Response, the parsed JSON body on `data`.
function fetchError(status: number, data: object): FetchError {
  return new FetchError({ response: new Response(JSON.stringify(data), { status }), data })
}

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

describe('isBlockedAccountError', () => {
  it('detects a ConnectError with Code.Unauthenticated', () => {
    expect(isBlockedAccountError(new ConnectError('UnauthorizedError: Account is blocked', Code.Unauthenticated))).toBe(
      true,
    )
  })

  it('detects an "account is blocked" reason case-insensitively', () => {
    expect(isBlockedAccountError(new Error('UnauthorizedError: ACCOUNT IS BLOCKED'))).toBe(true)
  })

  it('detects a blocked-account error nested on cause', () => {
    const err = new Error('bid failed')
    ;(err as Error & { cause: unknown }).cause = new Error('Account is blocked')
    expect(isBlockedAccountError(err)).toBe(true)
  })

  it('detects a trading 401 "Account is blocked" FetchError', () => {
    expect(
      isBlockedAccountError(fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Account is blocked' })),
    ).toBe(true)
  })

  it('detects an entry-gateway 403 COMPLIANCE_BLOCKED FetchError nested on cause', () => {
    const err = new Error('swap failed', {
      cause: fetchError(403, {
        errorCode: 'COMPLIANCE_BLOCKED',
        detail: 'Account is blocked',
        compliance: { walletBlocked: true },
      }),
    })
    expect(isBlockedAccountError(err)).toBe(true)
  })

  it('returns false for a 401 or 403 FetchError without a blocked-account body', () => {
    expect(isBlockedAccountError(fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Unauthorized' }))).toBe(
      false,
    )
    expect(isBlockedAccountError(fetchError(403, { errorCode: 'Forbidden', detail: 'Forbidden' }))).toBe(false)
  })

  it('returns false for other ConnectError codes', () => {
    expect(isBlockedAccountError(new ConnectError('deadline exceeded', Code.DeadlineExceeded))).toBe(false)
  })

  it('returns false for unrelated errors', () => {
    expect(isBlockedAccountError(new Error('execution reverted'))).toBe(false)
  })
})

describe('swapErrorToUserReadableMessage', () => {
  it('returns clean blocked-account copy without the generic slippage boilerplate', () => {
    const message = swapErrorToUserReadableMessage(
      t,
      new ConnectError('UnauthorizedError: Account is blocked', Code.Unauthenticated),
    )
    expect(message).toBe('swap.error.accountBlocked')
  })

  it('returns blocked-account copy for a /quote 403 Forbidden "Account is blocked"', () => {
    expect(
      swapErrorToUserReadableMessage(t, fetchError(403, { errorCode: 'Forbidden', detail: 'Account is blocked' })),
    ).toBe('swap.error.accountBlocked')
  })

  it('keeps the generic fallback for normal swap errors', () => {
    expect(swapErrorToUserReadableMessage(t, new Error('execution reverted: SOMETHING'))).toBe(
      'SOMETHING swap.error.default',
    )
  })
})
