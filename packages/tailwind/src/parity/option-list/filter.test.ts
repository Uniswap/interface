/**
 * Contract for the option-list word-prefix filter (INFRA-3021 dropdown set):
 * an exact port of the legacy NetworkFilterV2 search semantics
 * (`uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch.ts`
 * — normalizeNetworkSearchQuery + doesFieldMatchSearchPrefix), generalized
 * over label + keywords instead of chain metadata. Pure functions, exported
 * for real on BOTH platform legs.
 */
import { describe, expect, it } from 'vitest'
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import {
  normalizeOptionSearchQuery,
  optionMatchesSearchQuery,
} from '../../../../mycelium/src/option-list-compat/filter'

describe('normalizeOptionSearchQuery — legacy normalizeNetworkSearchQuery port', () => {
  it('trims, collapses inner whitespace, and lowercases', () => {
    expect(normalizeOptionSearchQuery('  Ethereum  ')).toBe('ethereum')
    expect(normalizeOptionSearchQuery('World   Chain')).toBe('world chain')
    expect(normalizeOptionSearchQuery('ARBITRUM')).toBe('arbitrum')
    expect(normalizeOptionSearchQuery('')).toBe('')
  })
})

describe('optionMatchesSearchQuery — word-prefix matching (legacy doesFieldMatchSearchPrefix port)', () => {
  const fields = { label: 'Ethereum', keywords: ['mainnet'] }

  it('an empty or whitespace query matches everything', () => {
    expect(optionMatchesSearchQuery(fields, '')).toBe(true)
    expect(optionMatchesSearchQuery(fields, '   ')).toBe(true)
  })

  it('matches on a label word prefix, case-insensitively', () => {
    expect(optionMatchesSearchQuery(fields, 'eth')).toBe(true)
    expect(optionMatchesSearchQuery(fields, 'ETH')).toBe(true)
    expect(optionMatchesSearchQuery(fields, 'Ethereum')).toBe(true)
  })

  it('does NOT match mid-word substrings (prefix semantics, not includes)', () => {
    expect(optionMatchesSearchQuery(fields, 'thereum')).toBe(false)
    expect(optionMatchesSearchQuery(fields, 'reum')).toBe(false)
  })

  it('matches later words of a multi-word label ("chain" hits "World Chain")', () => {
    const worldChain = { label: 'World Chain', keywords: ['worldchain'] }
    expect(optionMatchesSearchQuery(worldChain, 'chain')).toBe(true)
    expect(optionMatchesSearchQuery(worldChain, 'wor')).toBe(true)
  })

  it('requires multi-word queries to prefix-match CONSECUTIVE field words in order', () => {
    const worldChain = { label: 'World Chain', keywords: [] }
    expect(optionMatchesSearchQuery(worldChain, 'world ch')).toBe(true)
    expect(optionMatchesSearchQuery(worldChain, 'wo chain')).toBe(true)
    // Reversed order / non-consecutive words don't match.
    expect(optionMatchesSearchQuery(worldChain, 'chain world')).toBe(false)
  })

  it('matches on keywords (the legacy interfaceName leg)', () => {
    expect(optionMatchesSearchQuery(fields, 'main')).toBe(true)
    expect(optionMatchesSearchQuery({ label: 'BNB Chain', keywords: ['bnb', 'binance'] }, 'binan')).toBe(true)
  })

  it('normalizes whitespace in the query before matching', () => {
    const worldChain = { label: 'World Chain', keywords: [] }
    expect(optionMatchesSearchQuery(worldChain, '  world   ch  ')).toBe(true)
  })

  it('an all-whitespace field never matches a non-empty query', () => {
    expect(optionMatchesSearchQuery({ label: '   ', keywords: [] }, 'eth')).toBe(false)
  })
})
