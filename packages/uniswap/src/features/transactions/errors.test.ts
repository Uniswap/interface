import { FetchError } from '@universe/api'
import { getErrorContent, TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { SwapTransactionStepAsync } from 'uniswap/src/features/transactions/swap/steps/swap'
import { AppTFunction } from 'utilities/src/i18n/types'
import { describe, expect, it } from 'vitest'

const t = ((key: string) => key) as AppTFunction

const swapStep: SwapTransactionStepAsync = {
  type: TransactionStepType.SwapTransactionAsync,
  getTxRequest: async () => undefined,
}

// Built the way createFetchClient builds it: the status on the Response, the parsed JSON body on `data`.
function fetchError(status: number, data: object): FetchError {
  return new FetchError({ response: new Response(JSON.stringify(data), { status }), data })
}

// Wrapped the way the web swap saga wraps a failed /swap call.
function swapStepFailure(originalError: Error): TransactionStepFailedError {
  return new TransactionStepFailedError({
    message: `${swapStep.type} failed during swap`,
    step: swapStep,
    isBackendRejection: true,
    originalError,
  })
}

const BLOCKED_ACCOUNT_CONTENT = { title: 'common.blockedAddress', message: 'swap.error.accountBlocked' }

describe('getErrorContent', () => {
  it('shows blocked-account copy for trading 401 "Account is blocked"', () => {
    const error = swapStepFailure(fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Account is blocked' }))
    expect(getErrorContent(t, error)).toEqual(BLOCKED_ACCOUNT_CONTENT)
  })

  it('shows blocked-account copy for the entry-gateway 403 COMPLIANCE_BLOCKED', () => {
    const error = swapStepFailure(
      fetchError(403, {
        errorCode: 'COMPLIANCE_BLOCKED',
        detail: 'Account is blocked',
        compliance: { walletBlocked: true },
      }),
    )
    expect(getErrorContent(t, error)).toEqual(BLOCKED_ACCOUNT_CONTENT)
  })

  it('shows blocked-account copy when the FetchError is the cause of a plain Error', () => {
    const error = new Error('createNewPlan failed', {
      cause: fetchError(403, { errorCode: 'ForbiddenError', detail: 'Account is blocked' }),
    })
    expect(getErrorContent(t, error)).toEqual(BLOCKED_ACCOUNT_CONTENT)
  })

  it('keeps session-failure copy for a 401 without a blocked-account body', () => {
    const error = swapStepFailure(fetchError(401, { errorCode: 'UnauthorizedError', detail: 'Unauthorized' }))
    expect(getErrorContent(t, error).title).toBe('common.session.fail.title')
  })

  it('does not show blocked-account copy for a token-only 403 COMPLIANCE_BLOCKED', () => {
    const error = swapStepFailure(
      fetchError(403, {
        errorCode: 'COMPLIANCE_BLOCKED',
        detail: 'Token is blocked',
        compliance: {
          blockedTokens: [
            {
              chainId: 1,
              address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
              reasons: ['RESTRICTION_REASON_REQUIRES_ACKNOWLEDGEMENT'],
            },
          ],
        },
      }),
    )
    const content = getErrorContent(t, error)
    expect(content.title).not.toBe('common.blockedAddress')
    expect(content.title).not.toBe('common.session.fail.title')
  })
})
