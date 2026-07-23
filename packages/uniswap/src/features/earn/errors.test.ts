import { FetchError } from '@universe/api'
import type { AppTFunction } from 'ui/src/i18n/types'
import {
  EarnTradingApiErrorDetail,
  getEarnTradingApiErrorDetail,
  getEarnWithdrawErrorMessage,
} from 'uniswap/src/features/earn/errors'

const t = ((key: string) => key) as AppTFunction

function createFetchError(data?: unknown): FetchError {
  return new FetchError({
    response: new Response(null, { status: 400 }),
    data,
  })
}

describe('earn errors', () => {
  it('classifies low-liquidity trading API details', () => {
    const error = createFetchError({ detail: EarnTradingApiErrorDetail.InsufficientVaultLiquidity })

    expect(getEarnTradingApiErrorDetail(error)).toBe(EarnTradingApiErrorDetail.InsufficientVaultLiquidity)
    expect(getEarnWithdrawErrorMessage({ error, t })).toBe('explore.earn.withdraw.lowLiquidity.quoteError')
  })

  it('returns no-route copy only for known no-route quote errors', () => {
    expect(getEarnWithdrawErrorMessage({ error: createFetchError({ errorCode: 'NO_ROUTE' }), t })).toBe(
      'explore.earn.withdraw.noRoutes',
    )
    expect(getEarnWithdrawErrorMessage({ error: createFetchError({ detail: 'Internal Server Error' }), t })).toBe(
      'explore.earn.review.quoteError',
    )
  })
})
