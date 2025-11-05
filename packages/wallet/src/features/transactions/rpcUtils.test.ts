import { getRPCErrorCategory } from 'wallet/src/features/transactions/utils'
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
