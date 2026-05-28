import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { parseChainFromTokenSearchQuery } from 'uniswap/src/utils/search/parseChainFromTokenSearchQuery'

describe('parseChainFromTokenSearchQuery', () => {
  const enabledChains: UniverseChainId[] = [
    UniverseChainId.Mainnet,
    UniverseChainId.ArbitrumOne,
    UniverseChainId.Base,
    UniverseChainId.Optimism,
    UniverseChainId.Polygon,
  ]

  describe('null/empty input handling', () => {
    it('returns empty result for null/empty/whitespace inputs', () => {
      expect(parseChainFromTokenSearchQuery(null, enabledChains)).toEqual({ chainFilter: null, searchTerm: null })
      expect(parseChainFromTokenSearchQuery('', enabledChains)).toEqual({ chainFilter: null, searchTerm: null })
      expect(parseChainFromTokenSearchQuery('   ', enabledChains)).toEqual({ chainFilter: null, searchTerm: null })
    })
  })

  describe('single word searches', () => {
    it('returns search term for chain names without filtering', () => {
      expect(parseChainFromTokenSearchQuery('ethereum', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'ethereum',
      })
      expect(parseChainFromTokenSearchQuery('mainnet', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'mainnet',
      })
      expect(parseChainFromTokenSearchQuery('EtHeReUM', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'EtHeReUM',
      }) // preserves original casing
    })

    it('returns search term for non-chain words', () => {
      expect(parseChainFromTokenSearchQuery('dai', enabledChains)).toEqual({ chainFilter: null, searchTerm: 'dai' })
      expect(parseChainFromTokenSearchQuery('unsupported', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'unsupported',
      })
    })
  })

  describe('multi-word searches', () => {
    it('parses chain from first word', () => {
      expect(parseChainFromTokenSearchQuery('ethereum dai', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'dai',
      })
      expect(parseChainFromTokenSearchQuery('ethereum dai token', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'dai token',
      })
      expect(parseChainFromTokenSearchQuery('arbitrum uni corn token', enabledChains)).toEqual({
        chainFilter: UniverseChainId.ArbitrumOne,
        searchTerm: 'uni corn token',
      })
    })

    it('parses chain from last word when first word is not a chain', () => {
      expect(parseChainFromTokenSearchQuery('dai ethereum', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'dai',
      })
      expect(parseChainFromTokenSearchQuery('uni corn token base', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Base,
        searchTerm: 'uni corn token',
      })
    })

    it('prioritizes first word chain match over last word', () => {
      expect(parseChainFromTokenSearchQuery('base token ethereum', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Base,
        searchTerm: 'token ethereum',
      })
      expect(parseChainFromTokenSearchQuery('ethereum token base', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'token base',
      })
    })
  })

  describe('edge cases', () => {
    it('handles extra spaces and trimming', () => {
      expect(parseChainFromTokenSearchQuery('  ethereum   dai  ', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'dai',
      })
      expect(parseChainFromTokenSearchQuery('ethereum    dai', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Mainnet,
        searchTerm: 'dai',
      })
    })

    it('returns original search when no chain is found', () => {
      expect(parseChainFromTokenSearchQuery('random search terms', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'random search terms',
      })
    })

    it('handles chain name that matches but no search term remains', () => {
      expect(parseChainFromTokenSearchQuery('ethereum', enabledChains)).toEqual({
        chainFilter: null,
        searchTerm: 'ethereum',
      })
    })
  })

  describe('different chain types', () => {
    it('parses various chain types', () => {
      expect(parseChainFromTokenSearchQuery('arbitrum dai', enabledChains)).toEqual({
        chainFilter: UniverseChainId.ArbitrumOne,
        searchTerm: 'dai',
      })
      expect(parseChainFromTokenSearchQuery('base usdc', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Base,
        searchTerm: 'usdc',
      })
      expect(parseChainFromTokenSearchQuery('optimism link', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Optimism,
        searchTerm: 'link',
      })
      expect(parseChainFromTokenSearchQuery('polygon matic', enabledChains)).toEqual({
        chainFilter: UniverseChainId.Polygon,
        searchTerm: 'matic',
      })
    })
  })

  describe('empty enabled chains', () => {
    it('returns search term when no chains are enabled', () => {
      expect(parseChainFromTokenSearchQuery('eth dai', [])).toEqual({ chainFilter: null, searchTerm: 'eth dai' })
    })
  })
})
