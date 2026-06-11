import { describe, expect, it } from 'vitest'
import { getAddress } from './createGetAddress'

const CHECKSUMMED = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
const LOWERCASE = '0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed'
const UPPERCASE = '0x5AAEB6053F3E94C9B9A09F33669435E7EF1BEAED'

describe('getAddress', () => {
  it('returns already-checksummed addresses unchanged', () => {
    expect(getAddress(CHECKSUMMED)).toEqual(CHECKSUMMED)
  })

  it('checksums lowercase addresses', () => {
    expect(getAddress(LOWERCASE)).toEqual(CHECKSUMMED)
  })

  it('checksums all-uppercase hex', () => {
    expect(getAddress(UPPERCASE)).toEqual(CHECKSUMMED)
  })

  it('checksums the zero address', () => {
    const zero = '0x0000000000000000000000000000000000000000'
    expect(getAddress(zero)).toEqual(zero)
  })

  it('throws on invalid format', () => {
    expect(() => getAddress('not-an-address')).toThrow()
    expect(() => getAddress('')).toThrow()
  })

  it('throws on wrong length', () => {
    expect(() => getAddress('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe')).toThrow()
  })

  it('throws on missing 0x prefix', () => {
    expect(() => getAddress('5aaeb6053f3e94c9b9a09f33669435e7ef1beaed')).toThrow()
  })

  // viem does not validate EIP-55 checksums in `getAddress` — mixed-case input
  // with a wrong-case digit is silently re-checksummed rather than rejected.
  // Do not use `getAddress` to validate user-supplied checksums; use
  // `isAddress` first if rejection of typos is required.
  it('silently re-checksums mixed-case input with a bad checksum', () => {
    const badChecksum = '0x5AAEB6053f3e94c9b9a09f33669435e7ef1beaed'
    expect(getAddress(badChecksum)).toEqual(CHECKSUMMED)
  })
})
