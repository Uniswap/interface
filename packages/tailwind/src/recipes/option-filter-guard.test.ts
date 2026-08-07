/**
 * Guard contract for the shared word-prefix matcher (INFRA-3021 shadcn set):
 * host option data is often loosely typed (labels/keywords straight from API
 * payloads), so a non-string entry must never throw mid-keystroke — it simply
 * never matches. String inputs keep the exact legacy NetworkFilterV2
 * semantics (byte-identical behavior pinned by the parity suites).
 */
import { describe, expect, it } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import { optionMatchesSearchQuery, type SearchableOptionFields } from '../../../mycelium/src/shadcn/filter'

describe('optionMatchesSearchQuery — non-string field guard', () => {
  it('does not throw and does not match when the label is not a string', () => {
    const undefinedLabel = { label: undefined, keywords: ['ethereum'] } as unknown as SearchableOptionFields
    expect(() => optionMatchesSearchQuery(undefinedLabel, 'zz')).not.toThrow()
    expect(optionMatchesSearchQuery(undefinedLabel, 'zz')).toBe(false)
    // ...but intact keywords on the same option still match:
    expect(optionMatchesSearchQuery(undefinedLabel, 'eth')).toBe(true)

    const numberLabel = { label: 42 } as unknown as SearchableOptionFields
    expect(() => optionMatchesSearchQuery(numberLabel, 'four')).not.toThrow()
    expect(optionMatchesSearchQuery(numberLabel, 'four')).toBe(false)
  })

  it('does not throw and skips non-string keyword entries while string ones keep matching', () => {
    const option = {
      label: 'Ethereum',
      keywords: [undefined, null, 7, 'mainnet'],
    } as unknown as SearchableOptionFields
    expect(() => optionMatchesSearchQuery(option, 'main')).not.toThrow()
    expect(optionMatchesSearchQuery(option, 'main')).toBe(true)
    expect(optionMatchesSearchQuery(option, '7')).toBe(false)
  })

  it('does not throw when the keywords CONTAINER itself is not an array (ignored, not spread)', () => {
    const numberContainer = { label: 'Ethereum', keywords: 7 } as unknown as SearchableOptionFields
    expect(() => optionMatchesSearchQuery(numberContainer, 'eth')).not.toThrow()
    // ...the intact label still matches:
    expect(optionMatchesSearchQuery(numberContainer, 'eth')).toBe(true)

    // A bare-string container must be ignored — NOT spread into characters:
    const stringContainer = { label: 'Ethereum', keywords: 'mainnet' } as unknown as SearchableOptionFields
    expect(() => optionMatchesSearchQuery(stringContainer, 'main')).not.toThrow()
    expect(optionMatchesSearchQuery(stringContainer, 'main')).toBe(false)
    expect(optionMatchesSearchQuery(stringContainer, 'm')).toBe(false)
  })

  it('keeps the legacy string semantics unchanged (word-prefix, empty query matches all)', () => {
    const option: SearchableOptionFields = { label: 'Arbitrum One', keywords: ['arb'] }
    expect(optionMatchesSearchQuery(option, '')).toBe(true)
    expect(optionMatchesSearchQuery(option, '  one ')).toBe(true)
    expect(optionMatchesSearchQuery(option, 'arb')).toBe(true)
    expect(optionMatchesSearchQuery(option, 'rbitrum')).toBe(false)
  })
})
