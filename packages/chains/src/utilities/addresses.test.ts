import { describe, expect, it } from 'vitest'
import { Platform } from '../platforms/types'
import { getValidAddress, normalizeTokenAddressForCache } from './addresses'

/* -------------------------------------------------------------------------- */
/*                                  EVM FIXTURES                              */
/* -------------------------------------------------------------------------- */
const SAMPLE_SEED_ADDRESS_1 = '0x82D56A352367453f74FC0dC7B071b311da373Fa6'
const SAMPLE_SEED_ADDRESS_1_WITH_SPACE = `${SAMPLE_SEED_ADDRESS_1} `
const ADDRESS_NO_PREFIX = '71C7656EC7ab88b098defB751B7401B5f6d8976F'
const INVALID_EVM_WRONG_LENGTH = '0x71C7656EC7ab88b098defB751B7401B5f6d8'
const INVALID_EVM_BAD_PREFIX = '1x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const INVALID_EVM_NON_HEX = '0x71C7656EC7ab88b098defB751B7401B5f6d8976G' // contains G

/* -------------------------------------------------------------------------- */
/*                                  SVM FIXTURES                              */
/* -------------------------------------------------------------------------- */
// 32-byte base58 strings (taken from Solana docs / dev-net)
const VALID_SVM_ADDRESS_1 = '4Nd1mPraZmk6D7new6qR1pT7iEpXD6xzWxMnK46ZQPyW'
const VALID_SVM_ADDRESS_2 = '9xQeWvG816bUx9EPm2ERmuAHzp3ERWcGy3gPx1bMu7p'

const INVALID_SVM_SHORT = '4Nd1mPraZmk6D7new6qR1pT7' // < 32 bytes
const INVALID_SVM_NON_BASE58 = 'O0O0O0O0O0O0O0O0O0O0O0O0O0O' // has 0/O chars

/* -------------------------------------------------------------------------- */
/*                          Common junk inputs for both                       */
/* -------------------------------------------------------------------------- */
const NON_STRING_INVALIDS = [null, undefined, {}, { meow: 'woof' }, true]

/* -------------------------------------------------------------------------- */
/*                                  TESTS                                     */
/* -------------------------------------------------------------------------- */
describe('getValidAddress – EVM', () => {
  it.each`
    input                               | expected                                  | checksum
    ${SAMPLE_SEED_ADDRESS_1}            | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}    | ${false}
    ${SAMPLE_SEED_ADDRESS_1_WITH_SPACE} | ${SAMPLE_SEED_ADDRESS_1.toLowerCase()}    | ${false}
    ${SAMPLE_SEED_ADDRESS_1}            | ${SAMPLE_SEED_ADDRESS_1}                  | ${true}
    ${ADDRESS_NO_PREFIX}                | ${`0x${ADDRESS_NO_PREFIX}`.toLowerCase()} | ${false}
    ${INVALID_EVM_WRONG_LENGTH}         | ${null}                                   | ${false}
    ${INVALID_EVM_BAD_PREFIX}           | ${null}                                   | ${false}
    ${INVALID_EVM_NON_HEX}              | ${null}                                   | ${true}
  `('returns $expected for $input (checksum=$checksum)', ({ input, expected, checksum }) => {
    expect(getValidAddress({ address: input, platform: Platform.EVM, withEVMChecksum: checksum })).toEqual(expected)
  })

  it('normalizes a 0X-prefixed EVM address identically to a 0x-prefixed one', () => {
    const lowercasePrefixed = getValidAddress({ address: SAMPLE_SEED_ADDRESS_1, platform: Platform.EVM })
    const uppercasePrefixed = getValidAddress({
      address: `0X${SAMPLE_SEED_ADDRESS_1.slice(2)}`,
      platform: Platform.EVM,
    })
    expect(uppercasePrefixed).not.toBeNull()
    expect(uppercasePrefixed).toEqual(lowercasePrefixed)
  })

  it.each(NON_STRING_INVALIDS)('returns null for non-string input %o', (junk) => {
    expect(getValidAddress({ address: junk as any, platform: Platform.EVM })).toBeNull()
  })
})

describe('getValidAddress – SVM', () => {
  it.each`
    input                     | expected
    ${VALID_SVM_ADDRESS_1}    | ${VALID_SVM_ADDRESS_1}
    ${VALID_SVM_ADDRESS_2}    | ${VALID_SVM_ADDRESS_2}
    ${INVALID_SVM_SHORT}      | ${null}
    ${INVALID_SVM_NON_BASE58} | ${null}
  `('returns $expected for $input', ({ input, expected }) => {
    expect(getValidAddress({ address: input, platform: Platform.SVM })).toEqual(expected)
  })

  it.each(NON_STRING_INVALIDS)('returns null for non-string input %o', (junk) => {
    expect(getValidAddress({ address: junk as any, platform: Platform.SVM })).toBeNull()
  })
})

describe('normalizeTokenAddressForCache', () => {
  it('returns null for null', () => {
    expect(normalizeTokenAddressForCache(null)).toBeNull()
  })

  it("normalizes the native sentinel to lowercase 'native'", () => {
    expect(normalizeTokenAddressForCache('NATIVE')).toBe('native')
    expect(normalizeTokenAddressForCache('native')).toBe('native')
  })

  it('lowercases a valid EVM address', () => {
    expect(normalizeTokenAddressForCache(SAMPLE_SEED_ADDRESS_1)).toBe(SAMPLE_SEED_ADDRESS_1.toLowerCase())
  })

  it('preserves a case-sensitive SVM address unchanged', () => {
    expect(normalizeTokenAddressForCache(VALID_SVM_ADDRESS_1)).toBe(VALID_SVM_ADDRESS_1)
  })
})
