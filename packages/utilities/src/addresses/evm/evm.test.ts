import { isEVMAddress } from 'utilities/src/addresses/evm/evm'

describe('#isEVMAddress', () => {
  it('returns false if not', () => {
    expect(isEVMAddress('')).toBe(false)
    expect(isEVMAddress('0x0000')).toBe(false)
  })

  it('returns the checksummed address', () => {
    expect(isEVMAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe(
      '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a',
    )
    expect(isEVMAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe(
      '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a',
    )
  })

  it('succeeds even without prefix', () => {
    expect(isEVMAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
  })

  it('fails if too long', () => {
    expect(isEVMAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a0')).toBe(false)
  })
})
