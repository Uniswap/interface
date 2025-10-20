import { shortenAddress, shortenHash } from 'utilities/src/addresses'
import { INVALID_ADDRESS_TOO_LONG, INVALID_ADDRESS_TOO_SHORT } from 'utilities/src/test/fixtures'

describe('utils', () => {
  describe('#shortenAddress', () => {
    it.each`
      input                                           | expected           | desc
      ${INVALID_ADDRESS_TOO_SHORT}                    | ${''}              | ${'doesnt throw on invalid address'}
      ${INVALID_ADDRESS_TOO_LONG}                     | ${''}              | ${'doesnt throw on invalid address'}
      ${'0xf164fc0ec4e93095b804a4795bbe1e041497b92a'} | ${'0xf164...b92a'} | ${'returns the truncated address'}
      ${'0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5'} | ${'0x8C9A...9df5'} | ${'renders checksummed address'}
      ${undefined}                                    | ${''}              | ${'allows undefined'}
      ${false}                                        | ${''}              | ${'doesnt error on boolean'}
      ${null}                                         | ${''}              | ${'doesnt error on null'}
      ${'0x'}                                         | ${''}              | ${'doesnt error on 0x prefix'}
    `('$desc for shortenAddress($input) should return $expected', async ({ input, expected }) => {
      expect(shortenAddress({ address: input })).toEqual(expected)
    })

    it('allows custom amounts of start/end chars', () => {
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 2 })).toBe('0x8C...f5')
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 6 })).toBe(
        '0x8C9A8C...D09df5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 2, charsEnd: 2 })).toBe(
        '0x8C...f5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 2, charsEnd: 6 })).toBe(
        '0x8C...D09df5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 0, charsEnd: 4 })).toBe(
        '0x...9df5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 44 })).toBe(
        '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 43 })).toBe(
        '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5',
      )
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 1, charsEnd: 55 })).toBe(
        '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5',
      )
    })

    it('shortens to 4 chars on start & end if chars is not a positive integer', () => {
      expect(shortenAddress({ address: '0x8C9A8Ca25dF88ED92341e640A9A77CE196D09df5', chars: 0 })).toBe('0x8C9A...9df5')
    })
  })

  describe('#shortenHash', () => {
    it.each`
      input                                           | expected           | desc
      ${''}                                           | ${''}              | ${'returns empty string for empty input'}
      ${'0x'}                                         | ${'0x'}            | ${'returns 0x for 0x prefix only'}
      ${'0x1234567890abcdef'}                         | ${'0x1234...cdef'} | ${'returns the truncated hash'}
      ${'1234567890abcdef'}                           | ${'0x1234...cdef'} | ${'returns the truncated hash without prefix'}
      ${'0x2E1b342132A67Ea578e4E3B814bae2107dc254CC'} | ${'0x2E1b...54CC'} | ${'renders hash with mixed case'}
      ${undefined}                                    | ${''}              | ${'allows undefined'}
      ${false}                                        | ${''}              | ${'doesnt error on boolean'}
      ${null}                                         | ${''}              | ${'doesnt error on null'}
      ${'abc123'}                                     | ${'0xabc123'}      | ${'returns full string when too short to shorten'}
      ${'a'.repeat(100)}                              | ${'0xaaaa...aaaa'} | ${'handles very long strings'}
    `('$desc for shortenHash($input) should return $expected', async ({ input, expected }) => {
      expect(shortenHash(input)).toEqual(expected)
    })

    it('allows custom amounts of start/end chars', () => {
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2)).toBe('0x2E...CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 6)).toBe('0x2E1b34...c254CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 2)).toBe('0x2E...CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 2, 6)).toBe('0x2E...c254CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 0, 4)).toBe('0x...54CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 44)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
      expect(shortenHash('2E1b342132A67Ea578e4E3B814bae2107dc254CC', 43)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
      expect(shortenHash('2E1b342132A67Ea578e4E3B814bae2107dc254CC', 1, 55)).toBe(
        '0x2E1b342132A67Ea578e4E3B814bae2107dc254CC',
      )
    })

    it('shortens to 4 chars on start & end if chars is not a positive integer', () => {
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 0)).toBe('0x2E1b...54CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', -1)).toBe('0x2E1b...54CC')
      expect(shortenHash('0x2E1b342132A67Ea578e4E3B814bae2107dc254CC', 0, 0)).toBe('0x2E1b...54CC')
    })

    it('handles edge cases with very short strings', () => {
      expect(shortenHash('a')).toBe('0xa')
      expect(shortenHash('ab')).toBe('0xab')
      expect(shortenHash('abc')).toBe('0xabc')
      expect(shortenHash('abcd')).toBe('0xabcd')
    })
  })
})
