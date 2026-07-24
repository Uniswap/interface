import { Code, ConnectError } from '@connectrpc/connect'
import { isPoolRejectsLiquidityError } from 'uniswap/src/features/transactions/liquidity/utils'

describe(isPoolRejectsLiquidityError, () => {
  it('detects a gas estimation failure from a ConnectError', () => {
    const error = new ConnectError(
      'ResourceNotFound: BadRequest: FAILED_TO_ESTIMATE_GAS:{"name":"ResourceNotFound"}',
      Code.NotFound,
    )
    expect(isPoolRejectsLiquidityError(error)).toBe(true)
  })

  it('detects the machine-readable POOL_REJECTS_LIQUIDITY reason', () => {
    const error = new ConnectError('BadRequest: POOL_REJECTS_LIQUIDITY', Code.NotFound)
    expect(isPoolRejectsLiquidityError(error)).toBe(true)
  })

  it('detects markers on plain errors', () => {
    expect(isPoolRejectsLiquidityError(new Error('FAILED_TO_ESTIMATE_GAS'))).toBe(true)
  })

  it('detects markers on legacy error structures', () => {
    expect(isPoolRejectsLiquidityError({ data: { detail: 'FAILED_TO_ESTIMATE_GAS' } })).toBe(true)
  })

  it('returns false for unrelated errors', () => {
    expect(isPoolRejectsLiquidityError(undefined)).toBe(false)
    expect(isPoolRejectsLiquidityError(null)).toBe(false)
    expect(isPoolRejectsLiquidityError(new Error('something else went wrong'))).toBe(false)
    expect(isPoolRejectsLiquidityError(new ConnectError('RateLimited', Code.ResourceExhausted))).toBe(false)
    expect(isPoolRejectsLiquidityError({ data: { detail: 'other' } })).toBe(false)
  })
})
