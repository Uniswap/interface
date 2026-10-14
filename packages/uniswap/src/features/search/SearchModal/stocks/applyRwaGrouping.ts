import type { UniverseChainId } from '@universe/chains'
import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import type { CurrencyInfo, SearchTokenStats } from 'uniswap/src/features/dataApi/types'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import {
  aggregateRwaCollectionStats,
  buildRwaCollectionOption,
  findRwaForToken,
  getRwaCollectionKey,
  rwaChainAddressKey,
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

function optionCurrencyInfos(option: SearchModalOption): CurrencyInfo[] {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return [option.currencyInfo]
    case OnchainItemListOptionType.MultichainToken:
      return option.multichainResult.tokens
    default:
      return []
  }
}

/** Backend issuer branding carried by v2-built results, keyed by chain deployment. Empty on the v1 search path. */
function buildIssuerBrandingIndex(options: SearchModalOption[]): Map<string, RWAIssuerDisplay> {
  const index = new Map<string, RWAIssuerDisplay>()
  for (const option of options) {
    for (const currencyInfo of optionCurrencyInfos(option)) {
      if (currencyInfo.issuer) {
        index.set(
          rwaChainAddressKey(currencyInfo.currency.chainId, currencyAddress(currencyInfo.currency)),
          currencyInfo.issuer,
        )
      }
    }
  }
  return index
}

/** Fills each issuer's display name / logo from the branding index; the v1 `ListRwas` index carries only slugs. */
function withRwaIssuerBranding({
  rwa,
  brandingIndex,
}: {
  rwa: Rwa
  brandingIndex: Map<string, RWAIssuerDisplay>
}): Rwa {
  if (brandingIndex.size === 0) {
    return rwa
  }
  return {
    ...rwa,
    issuerTokens: rwa.issuerTokens.map((issuer) => {
      for (const chainToken of issuer.chainTokens) {
        const branding = brandingIndex.get(rwaChainAddressKey(chainToken.chainId, chainToken.address))
        if (branding) {
          return {
            ...issuer,
            issuerDisplayName: issuer.issuerDisplayName ?? branding.issuerDisplayName,
            issuerLogoUrl: issuer.issuerLogoUrl ?? branding.issuerLogoUrl,
          }
        }
      }
      return issuer
    }),
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
  plainTokenNames,
}: {
  options: SearchModalOption[]
  index: RwaSearchIndex
  isAddressSearch: boolean
  chainFilter: UniverseChainId | null
  plainTokenNames: boolean
}): SearchModalOption[] {
  const items: SearchModalOption[] = []
  const seenCollectionKeys = new Set<string>()
  // Collected before grouping so the floor/volume include issuers that dedupe into an already-emitted collection.
  const statsByCollectionKey = new Map<string, SearchTokenStats[]>()

  const brandingIndex = buildIssuerBrandingIndex(options)
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
      items.push(option)
      continue
    }

    // Direct-CA search: never roll up; tag the single matched token with its RWA identity.
    if (isAddressSearch) {
      items.push(tagOptionAsRwa({ option, match, plainTokenNames }))
      continue
    }

    const collectionKey = getRwaCollectionKey({ rwa: match.rwa })
    if (seenCollectionKeys.has(collectionKey)) {
      continue // dedupe: another issuer token of an already-emitted collection
    }
    seenCollectionKeys.add(collectionKey)

    const rwa = withRwaIssuerBranding({
      rwa: chainFilter ? filterRwaToChain(match.rwa, chainFilter) : match.rwa,
      brandingIndex,
    })
    if (rwa.issuerTokens.length >= 2) {
      items.push(
        buildRwaCollectionOption({
          rwa,
          showCategoryTag: true,
          searchStats: aggregateRwaCollectionStats(statsByCollectionKey.get(collectionKey) ?? []),
        }),
      )
    } else {
      // single issuer on-chain -> tagged token with its RWA identity
      items.push(tagOptionAsRwa({ option, match, plainTokenNames }))
    }
  }

  return items
}
