import {
  filterNetworkOptions,
  normalizeNetworkSearchQuery,
  useNetworkFilterSearch,
} from 'uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import i18next from 'uniswap/src/i18n'
import { renderHookWithProviders } from 'uniswap/src/test/render'
import { act } from 'uniswap/src/test/test-utils'
import { vi } from 'vitest'

describe('useNetworkFilterSearch', () => {
  it('normalizes whitespace and casing in the search query', () => {
    expect(normalizeNetworkSearchQuery('  WoRLD   CHAIN  ')).toBe('world chain')
  })

  it('returns all chainIds when the search query is empty', () => {
    const chainIds = [UniverseChainId.Base, UniverseChainId.WorldChain, UniverseChainId.Polygon]

    const result = filterNetworkOptions({
      chainIds,
      includeAllNetworks: true,
      searchQuery: '',
    })

    expect(result.filteredChainIds).toEqual(chainIds)
    expect(result.filteredTieredOptions).toBeUndefined()
    expect(result.showAllNetworks).toBe(true)
  })

  it('filters flat options by word-prefix matches and preserves the original order', () => {
    const chainIds = [
      UniverseChainId.WorldChain,
      UniverseChainId.Unichain,
      UniverseChainId.Polygon,
      UniverseChainId.Base,
    ]

    const result = filterNetworkOptions({
      chainIds,
      searchQuery: ' chain ',
    })

    expect(result.filteredChainIds).toEqual([UniverseChainId.WorldChain])
  })

  it('does not match when the query only appears in the middle of a word', () => {
    const result = filterNetworkOptions({
      chainIds: [UniverseChainId.WorldChain, UniverseChainId.Unichain],
      searchQuery: 'ich',
    })

    expect(result.filteredChainIds).toEqual([])
  })

  it('matches multi-word prefixes within a label', () => {
    const result = filterNetworkOptions({
      chainIds: [UniverseChainId.WorldChain, UniverseChainId.Unichain],
      searchQuery: 'world ch',
    })

    expect(result.filteredChainIds).toEqual([UniverseChainId.WorldChain])
  })

  it('filters tiered options by word-prefix matches and preserves section ordering', () => {
    const tieredOptions = {
      withBalances: [
        { chainId: UniverseChainId.WorldChain, label: 'World Chain', balanceUSD: 900 },
        { chainId: UniverseChainId.Optimism, label: 'Optimism', balanceUSD: 500 },
      ],
      otherNetworks: [
        { chainId: UniverseChainId.Unichain, label: 'Unichain', balanceUSD: 0 },
        { chainId: UniverseChainId.Polygon, label: 'Polygon', balanceUSD: 0 },
      ],
    }

    const result = filterNetworkOptions({
      chainIds: tieredOptions.withBalances.concat(tieredOptions.otherNetworks).map((option) => option.chainId),
      tieredOptions,
      searchQuery: 'chain',
    })

    expect(result.filteredTieredOptions?.withBalances.map((option) => option.chainId)).toEqual([
      UniverseChainId.WorldChain,
    ])
    expect(result.filteredTieredOptions?.otherNetworks.map((option) => option.chainId)).toEqual([])
  })

  it('returns filtered data from the hook when search changes', () => {
    const { result } = renderHookWithProviders(() =>
      useNetworkFilterSearch({
        chainIds: [UniverseChainId.Base, UniverseChainId.Polygon],
        includeAllNetworks: true,
      }),
    )

    act(() => {
      result.current.setSearchQuery('does-not-exist')
    })

    expect(result.current.filteredChainIds).toEqual([])
    expect(result.current.filteredTieredOptions).toBeUndefined()
    expect(result.current.showAllNetworks).toBe(false)
  })
})
