import type { UniverseChainId } from '@universe/chains'
import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import type { SearchTokenStats } from 'uniswap/src/features/dataApi/types'
import {
  aggregateRwaCollectionStats,
  buildRwaCollectionOption,
  findRwaForToken,
  getRwaCollectionKey,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'
import { currencyAddress } from 'uniswap/src/utils/currencyId'

/** Every (chainId,address) an option resolves to (one for Token, N for MultichainToken). */
export function optionChainAddresses(option: SearchModalOption): { chainId: number; address: string }[] {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return [{ chainId: option.currencyInfo.currency.chainId, address: currencyAddress(option.currencyInfo.currency) }]
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.tokens.map((t) => ({
        chainId: t.currency.chainId,
        address: currencyAddress(t.currency),
      }))
    default:
      return []
  }
}

function optionSearchStats(option: SearchModalOption): SearchTokenStats | undefined {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return option.currencyInfo.searchStats
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.stats
    default:
      return undefined
  }
}

/** Restrict a Rwa's issuers/chains to those present on `chainFilter`. */
function filterRwaToChain(rwa: Rwa, chainFilter: UniverseChainId): Rwa {
  const issuerTokens = rwa.issuerTokens
    .map((issuer) => ({ ...issuer, chainTokens: issuer.chainTokens.filter((c) => c.chainId === chainFilter) }))
    .filter((issuer) => issuer.chainTokens.length > 0)
  return { ...rwa, issuerTokens }
}

export function applyRwaGroupingToSearchOptions({
  options,
  index,
  isAddressSearch,
  chainFilter,
  hoistRwaToTop,
  plainTokenNames,
}: {
  options: SearchModalOption[]
  index: RwaSearchIndex
  isAddressSearch: boolean
  chainFilter: UniverseChainId | null
  hoistRwaToTop: boolean
  plainTokenNames: boolean
}): SearchModalOption[] {
  const items: { option: SearchModalOption; isRwa: boolean }[] = []
  const seenCollectionKeys = new Set<string>()
  // Collected before grouping so the floor/volume include issuers that dedupe into an already-emitted collection.
  const statsByCollectionKey = new Map<string, SearchTokenStats[]>()

  const matches = options.map((option) => ({
    option,
    match: optionChainAddresses(option)
      .map((ca) => findRwaForToken(index, ca))
      .find(Boolean),
  }))

  for (const { option, match } of matches) {
    const stats = match && optionSearchStats(option)
    if (!stats) {
      continue
    }
    const collectionKey = getRwaCollectionKey({ rwa: match.rwa })
    statsByCollectionKey.set(collectionKey, [...(statsByCollectionKey.get(collectionKey) ?? []), stats])
  }

  for (const { option, match } of matches) {
    if (!match) {
      items.push({ option, isRwa: false })
      continue
    }

    // Direct-CA search: never roll up; tag the single matched token with its RWA identity.
    if (isAddressSearch) {
      items.push({ option: tagOptionAsRwa({ option, match, plainTokenNames }), isRwa: true })
      continue
    }

    const collectionKey = getRwaCollectionKey({ rwa: match.rwa })
    if (seenCollectionKeys.has(collectionKey)) {
      continue // dedupe: another issuer token of an already-emitted collection
    }
    seenCollectionKeys.add(collectionKey)

    const rwa = chainFilter ? filterRwaToChain(match.rwa, chainFilter) : match.rwa
    if (rwa.issuerTokens.length >= 2) {
      items.push({
        option: buildRwaCollectionOption({
          rwa,
          showCategoryTag: true,
          searchStats: aggregateRwaCollectionStats(statsByCollectionKey.get(collectionKey) ?? []),
        }),
        isRwa: true,
      })
    } else {
      // single issuer on-chain -> tagged token with its RWA identity
      items.push({ option: tagOptionAsRwa({ option, match, plainTokenNames }), isRwa: true })
    }
  }

  const ordered = hoistRwaToTop ? [...items.filter((i) => i.isRwa), ...items.filter((i) => !i.isRwa)] : items
  return ordered.map((i) => i.option)
}
