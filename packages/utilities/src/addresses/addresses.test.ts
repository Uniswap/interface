import { INVALID_ADDRESS_TOO_LONG, INVALID_ADDRESS_TOO_SHORT } from 'utilities/src/test/fixtures'
import { isAddress, shortenAddress } from '.'

describe('utils', () => {
  describe('#isAddress', () => {
    it('returns false if not', () => {
      expect(isAddress('')).toBe(false)
      expect(isAddress('0x0000')).toBe(false)
    })

    it('returns the checksummed address', () => {
      expect(isAddress('0xf164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
      expect(isAddress('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
    })

    it('succeeds even without prefix', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a')).toBe('0xf164fC0Ec4E93095b804a4795bBe1e041497b92a')
    })

    it('fails if too long', () => {
      expect(isAddress('f164fc0ec4e93095b804a4795bbe1e041497b92a0')).toBe(false)
    })
  })

  describe('#shortenAddress', () => {
    it.each`
      input                                           | expected           | desc
      ${INVALID_ADDRESS_TOO_SHORT}                    | ${''}              | ${'doesnt throw on invalid address'}
      ${INVALID_ADDRESS_TOO_LONG}                     | ${''}              | ${'doesnt throw on invalid address'}
      ${'0xf164fc0ec4e93095b804a4795bbe1e041497b92a'} | ${'0xf164...b92a'} | ${'returns the truncated address'}
      ${'f164fc0ec4e93095b804a4795bbe1e041497b92a'}   | ${'0xf164...b92a'} | ${'returns the truncated address without prefix'}
      ${'0x2E1b342132A67Ea578e4E3B814bae2107dc254CC'} | ${'0x2E1b...54CC'} | ${'renders checksummed address'}
      ${undefined}                                    | ${''}              | ${'allows undefined'}
      ${false}                                        | ${''}              | ${'doesnt error on boolean'}
      ${null}                                         | ${''}              | ${'doesnt error on null'}
      ${'0x'}                                         | ${''}              | ${'doesnt error on 0x prefix'}
    `('$desc for shortenAddress($input) should return $expected', async ({ input, expected }) => {
      expect(shortenAddress(input)).toEqual(expected)
    })

    it('allows custom amounts of start/end chars', () => {
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2)).toBe('0x2E...CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 6)).toBe('0x2E1b34...c254CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 2)).toBe('0x2E...CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 6)).toBe('0x2E...c254CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 0, 4)).toBe('0x...54CC')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 0)).toBe('0x...')
      expect(shortenAddress('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 44)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
      expect(shortenAddress('2E1b342132A67Ea578e4E3B814bae2107dc254CC', 43)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
      expect(shortenAddress('2E1b342132A67Ea578e4E3B814bae2107dc254CC', 1, 55)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
    })
  })
})
