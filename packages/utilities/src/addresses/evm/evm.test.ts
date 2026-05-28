import { isEVMAddress, isEVMAddressWithChecksum } from 'utilities/src/addresses/evm/evm'

describe('utils', () => {
  describe('#isEVMAddress', () => {
    it('returns false if not', () => {
      expect(isEVMAddress('')).toBe(false)
      expect(isEVMAddress('0x0000')).toBe(false)
    })
  })

  it('returns true for valid formatted address', () => {
    expect(isEVMAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe(true)
    expect(isEVMAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe(true)
  })

  it('fails if too long', () => {
    expect(isEVMAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92abcdefghijk')).toBe(false)
  })

  describe('#isEVMAddressWithChecksum', () => {
    it('returns false if not', () => {
      expect(isEVMAddressWithChecksum('')).toBe(false)
      expect(isEVMAddressWithChecksum('0x0000')).toBe(false)
    })

    it('returns true for checksummed address', () => {
      expect(isEVMAddressWithChecksum('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe(true)
    })

    it('returns false for bad checksummed address', () => {
      // last character is 'b' when it should be the 'a'
      expect(isEVMAddressWithChecksum('0xf164fC0Ec4E93095b804a4795bBe1e041497b92b')).toBe(false)
    })

    it('returns false for invalid address', () => {
      // last character is 'b' when it should be the 'a'
      expect(isEVMAddressWithChecksum('0xf164fC0Ec4E93095b804a4795bBe1e041497b92b')).toBe(false)
    })

    it('fails if too long', () => {
      expect(isEVMAddressWithChecksum('f164fc0ec4e93095b804a4795bbe1e041497b92a0')).toBe(false)
    })
  })
})
