import { getUniconColors, getUniconsDeterministicHash } from 'ui/src/components/Unicon/utils'
import { describe, expect, it } from 'vitest'

const CHECKSUMMED_EVM_ADDRESS = '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
const LOWERCASE_EVM_ADDRESS = CHECKSUMMED_EVM_ADDRESS.toLowerCase()
const SVM_ADDRESS = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'

describe(getUniconsDeterministicHash, () => {
  it('preserves the established checksummed EVM address hash', () => {
    expect(getUniconsDeterministicHash(CHECKSUMMED_EVM_ADDRESS)).toBe(BigInt('440935458359'))
  })

  it('maps lowercase EVM addresses to the established checksummed hash', () => {
    expect(getUniconsDeterministicHash(LOWERCASE_EVM_ADDRESS)).toBe(BigInt('440935458359'))
  })

  it('preserves case-sensitive SVM hashing', () => {
    expect(getUniconsDeterministicHash(SVM_ADDRESS)).toBe(BigInt('453328224334'))
  })

  it('rejects invalid addresses', () => {
    expect(() => getUniconsDeterministicHash('not-an-address')).toThrow('Invalid address')
  })
})

describe(getUniconColors, () => {
  it.each([
    { isDark: false, color: '#4300B0' },
    { isDark: true, color: '#9E62FF' },
  ])('preserves the established EVM color when isDark=$isDark', ({ isDark, color }) => {
    expect(getUniconColors(CHECKSUMMED_EVM_ADDRESS, isDark)).toEqual({ color })
    expect(getUniconColors(LOWERCASE_EVM_ADDRESS, isDark)).toEqual({ color })
  })
})
