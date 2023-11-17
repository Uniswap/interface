import { addressesAreEquivalent } from './addressesAreEquivalent'

describe('addressesAreEquivalent', () => {
  it('should return false for undefined addresses', () => {
    expect(addressesAreEquivalent(undefined, undefined)).toBe(false)
  })
  it('should return true for mismatched checksum equivalence', () => {
    expect(
      addressesAreEquivalent(
        '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78',
        '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78'.toLowerCase()
      )
    ).toBe(true)
  })
  it('should return true for simple equivalence', () => {
    expect(
      addressesAreEquivalent('0x48c89D77ae34Ae475e4523b25aB01e363dce5A78', '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78')
    ).toBe(true)
  })
})
