import { getRPCErrorCategory, getRPCErrorCode, getRPCProvider } from 'wallet/src/features/transactions/utils'
import { rpcUtilsFixtures } from 'wallet/src/test/rpcUtilsFixtures'

describe('getRPCErrorCategory', () => {
  it.each([
    { error: rpcUtilsFixtures.nonceError, expected: 'nonce_error' },
    { error: rpcUtilsFixtures.reverted, expected: 'reverted' },
    {
      error: rpcUtilsFixtures.txLimitReachedForDelegatedAccount,
      expected: 'tx_limit_reached_for_delegated_account',
    },
    { error: rpcUtilsFixtures.timeout, expected: 'timeout' },
    { error: rpcUtilsFixtures.confirmationTimeout, expected: 'confirmation_timeout' },
    { error: rpcUtilsFixtures.noNetwork, expected: 'no_network' },
    { error: rpcUtilsFixtures.rateLimited1, expected: 'rate_limited' },
    { error: rpcUtilsFixtures.rateLimited2, expected: 'rate_limited' },
    { error: rpcUtilsFixtures.insufficientFunds1, expected: 'insufficient_funds' },
    { error: rpcUtilsFixtures.insufficientFunds2, expected: 'insufficient_funds' },
    { error: rpcUtilsFixtures.insufficientFunds3, expected: 'insufficient_funds' },
    { error: rpcUtilsFixtures.instrinsicGasTooLow, expected: 'gas_too_low' },
    { error: rpcUtilsFixtures.gasTooLow, expected: 'gas_too_low' },
    { error: rpcUtilsFixtures.invalidDataValue, expected: 'invalid_data' },
    { error: rpcUtilsFixtures.cannotReadProperty1, expected: 'invalid_data' },
    { error: rpcUtilsFixtures.cannotReadProperty2, expected: 'invalid_data' },
    { error: rpcUtilsFixtures.badGateway, expected: 'bad_gateway' },
    { error: rpcUtilsFixtures.missingResponseBody, expected: 'unknown' },
  ])('should return $expected for $error', ({ error, expected }) => {
    expect(getRPCErrorCategory(new Error(error))).toBe(expected)
  })
})

describe('getRPCErrorCode', () => {
  it.each([
    { error: rpcUtilsFixtures.nonceError, expected: 'SERVER_ERROR' },
    { error: rpcUtilsFixtures.timeout, expected: 'TIMEOUT' },
    { error: rpcUtilsFixtures.gasTooLow, expected: 'REPLACEMENT_UNDERPRICED' },
    { error: rpcUtilsFixtures.insufficientFunds2, expected: 'INSUFFICIENT_FUNDS' },
    { error: rpcUtilsFixtures.badGateway, expected: 'SERVER_ERROR' },
    { error: rpcUtilsFixtures.missingResponseBody, expected: 'SERVER_ERROR' },
    { error: rpcUtilsFixtures.noNetwork, expected: 'NETWORK_ERROR' },
    { error: rpcUtilsFixtures.txLimitReachedForDelegatedAccount, expected: 'SERVER_ERROR' },
    { error: rpcUtilsFixtures.confirmationTimeout, expected: 'SERVER_ERROR' },
  ])('should extract error code from $error', ({ error, expected }) => {
    expect(getRPCErrorCode(new Error(error))).toBe(expected)
  })

  it('should return undefined when error message has no code=', () => {
    expect(getRPCErrorCode(new Error(rpcUtilsFixtures.reverted))).toBeUndefined()
    expect(getRPCErrorCode(new Error(rpcUtilsFixtures.invalidDataValue))).toBeUndefined()
    expect(getRPCErrorCode(new Error(rpcUtilsFixtures.rateLimited1))).toBeUndefined()
    expect(getRPCErrorCode(new Error(rpcUtilsFixtures.rateLimited2))).toBeUndefined()
    expect(getRPCErrorCode(new Error(rpcUtilsFixtures.cannotReadProperty1))).toBeUndefined()
  })

  it('should truncate error codes longer than 50 characters', () => {
    const longCodeError = new Error(
      'some error message code=THIS_IS_A_VERY_LONG_ERROR_CODE_THAT_EXCEEDS_50_CHARS, more text',
    )
    expect(getRPCErrorCode(longCodeError)).toBe('THIS_IS_A_VERY_LONG_ERROR_CODE_THAT_EXCEEDS_50_CHA')
  })

  it('should stop at comma if present', () => {
    const errorWithComma = new Error('error message code=ERROR_CODE, additional info')
    expect(getRPCErrorCode(errorWithComma)).toBe('ERROR_CODE')
  })

  it('should return undefined when code= is present but has no value', () => {
    expect(getRPCErrorCode(new Error('error message code=, more text'))).toBeUndefined()
    expect(getRPCErrorCode(new Error('error message code='))).toBeUndefined()
  })

  it('should handle numeric error codes', () => {
    const numericCodeError = new Error('error message code=-32000, more info')
    expect(getRPCErrorCode(numericCodeError)).toBe('-32000')
  })

  it('should return undefined for empty error message', () => {
    expect(getRPCErrorCode(new Error(''))).toBeUndefined()
  })
})

describe('getRPCProvider', () => {
  it('should return the provider name from the error message', () => {
    expect(getRPCProvider(new Error('request failed: https://mainnet.infura.io/v3/abc123'))).toBe('infura')
    expect(getRPCProvider(new Error('connection error: https://quicknode.com/endpoint'))).toBe('quicknode')
    expect(getRPCProvider(new Error('timeout: https://rpc.flashbots.net'))).toBe('flashbots')
    expect(getRPCProvider(new Error('generic error message'))).toBe('n/a')
  })
})
