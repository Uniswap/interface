import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  buildRwaCollectionOption,
  findRwaForToken,
  getRwaCollectionKey,
  type RwaSearchIndex,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
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
}: {
  options: SearchModalOption[]
  index: RwaSearchIndex
  isAddressSearch: boolean
  chainFilter: UniverseChainId | null
}): SearchModalOption[] {
  const stockItems: SearchModalOption[] = []
  const genericItems: SearchModalOption[] = []
  const seenCollectionKeys = new Set<string>()

  for (const option of options) {
    const match = optionChainAddresses(option)
      .map((ca) => findRwaForToken(index, ca))
      .find(Boolean)

    if (!match) {
      genericItems.push(option)
      continue
    }

    // Direct-CA search: never roll up; tag the single matched token.
    if (isAddressSearch) {
      stockItems.push({
        ...option,
        rwaCategory: getRwaTagCategory({ categories: match.rwa.categories }),
      } as SearchModalOption)
      continue
    }

    const collectionKey = getRwaCollectionKey({ rwa: match.rwa })
    if (seenCollectionKeys.has(collectionKey)) {
      continue // dedupe: another issuer token of an already-emitted collection
    }
    seenCollectionKeys.add(collectionKey)

    const rwa = chainFilter ? filterRwaToChain(match.rwa, chainFilter) : match.rwa
    if (rwa.issuerTokens.length >= 2) {
      stockItems.push(buildRwaCollectionOption({ rwa, showCategoryTag: true }))
    } else {
      // single issuer on-chain -> tagged token
      stockItems.push({
        ...option,
        rwaCategory: getRwaTagCategory({ categories: match.rwa.categories }),
      } as SearchModalOption)
    }
  }

  return [...stockItems, ...genericItems]
}
