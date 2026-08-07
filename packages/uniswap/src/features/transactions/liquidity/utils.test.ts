import { Code, ConnectError } from '@connectrpc/connect'
import { isPoolRejectsLiquidityError, parseErrorMessageTitle } from 'uniswap/src/features/transactions/liquidity/utils'

describe(parseErrorMessageTitle, () => {
  it('extracts the name field from an embedded JSON payload', () => {
    const error = new ConnectError('BadRequest: FAILED_TO_ESTIMATE_GAS:{"name":"ResourceNotFound"}', Code.NotFound)
    expect(parseErrorMessageTitle(error, {})).toEqual('ResourceNotFound')
  })

  it('should extract the code field when the payload has no name (KYC_REQUIRED)', () => {
    // Repro for ECO-608: the backend permissioned-pool rejection is keyed on `code`, and the
    // parser used to fall through to the entire raw message, dumping raw JSON into the UI.
    const error = new ConnectError(
      'BadRequest: {"code":"KYC_REQUIRED","kyc_url":"https://app.uniswap.org","token_address":"0xb73055db2B3A3EaE87a331DD88e4a80b43602690"}',
      Code.NotFound,
    )
    expect(parseErrorMessageTitle(error, {})).toEqual('KYC_REQUIRED')
  })

  it('should extract the code field when the payload has no name (INVALID_HOOK_FOR_PERMISSIONED_POOL)', () => {
    const error = new ConnectError(
      'BadRequest: {"code":"INVALID_HOOK_FOR_PERMISSIONED_POOL","currency":"0xe5b72177ed806888ca790056e9a0b7e6f74a80f3"}',
      Code.NotFound,
    )
    expect(parseErrorMessageTitle(error, {})).toEqual('INVALID_HOOK_FOR_PERMISSIONED_POOL')
  })

  it('should fall back to the default title instead of the raw JSON when the payload has neither name nor code', () => {
    const error = new ConnectError('BadRequest: {"detail":"something exploded","status":400}', Code.NotFound)
    expect(parseErrorMessageTitle(error, { defaultTitle: 'unknown error' })).toEqual('unknown error')
  })

  it('returns the raw message when it contains no JSON payload', () => {
    const error = new ConnectError('RateLimited', Code.ResourceExhausted)
    expect(parseErrorMessageTitle(error, {})).toEqual('RateLimited')
  })
})

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
