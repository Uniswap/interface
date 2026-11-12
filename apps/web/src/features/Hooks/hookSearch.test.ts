import { describe, expect, it } from 'vitest'
import { getHookSearchAddress, normalizeHookSearch } from '~/features/Hooks/hookSearch'

describe('Hook search normalization', () => {
  it('normalizes only whitespace and case for query identity and matching', () => {
    expect(normalizeHookSearch('  StablePairHOOK  ')).toBe('stablepairhook')
    expect(normalizeHookSearch('  ')).toBe('')
    expect(normalizeHookSearch()).toBe('')
  })

  it('recognizes a full mixed-case address without requiring a checksum', () => {
    expect(getHookSearchAddress('  0xABCdef123456789012345678901234567890ABcd  ')).toBe(
      '0xabcdef123456789012345678901234567890abcd',
    )
  })

  it.each(['', 'Angstrom', '0x1234', '0xgggggggggggggggggggggggggggggggggggggggg', `0x${'a'.repeat(41)}`])(
    'does not treat %s as a complete address lookup',
    (search) => {
      expect(getHookSearchAddress(search)).toBeUndefined()
    },
  )
})
