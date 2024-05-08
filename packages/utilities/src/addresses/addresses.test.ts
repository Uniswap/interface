import { isAddress, shortenAddress } from '.'

describe('utils', () => {
  describe('#isAddress', () => {
    it('returns false if not', () => {
      expect(isAddress('')).toBe(false)
      expect(isAddress('0x0000')).toBe(false)
    })

    it('returns the checksummed address', () => {
      expect(isAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe(
        '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
      )
      expect(isAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe(
        '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
      )
    })

    it('succeeds even without prefix', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe(
        '0xf164fC0Ec4E93095b804a4795bBe1e041497b92a'
      )
    })

    it('fails if too long', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a0')).toBe(false)
    })
  })

  describe('#shortenAddress', () => {
    it('doesnt throw on invalid address', () => {
      expect(shortenAddress('abc123')).toEqual('')
    })

    it('truncates middle characters', () => {
      expect(shortenAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164...b92a')
    })

    it('truncates middle characters even without prefix', () => {
      expect(shortenAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164...b92a')
    })

    it('renders checksummed address', () => {
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC'.toLowerCase())).toBe(
        '0x2E1b...54CC'
      )
    })

    it('allows undefined', () => {
      expect(shortenAddress()).toBe('')
    })

    it('allows custom amounts of start/end chars', () => {
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2)).toBe('0x2E...54CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 6)).toBe(
        '0x2E1b34...54CC'
      )
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 2)).toBe('0x2E...CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 6)).toBe(
        '0x2E...c254CC'
      )
    })
  })
})
