import { useMemo, useState } from 'react'
import type { TieredNetworkOptions } from 'uniswap/src/components/network/NetworkFilterV2/types'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import i18next from 'uniswap/src/i18n'

interface FilterNetworkOptionsParams {
  chainIds: UniverseChainId[]
  tieredOptions?: TieredNetworkOptions
  includeAllNetworks?: boolean
}

interface FilteredNetworkOptionsResult {
  filteredChainIds: UniverseChainId[]
  filteredTieredOptions?: TieredNetworkOptions
  showAllNetworks: boolean
}

interface UseNetworkFilterSearchResult extends FilteredNetworkOptionsResult {
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export function normalizeNetworkSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase()
}

function doesFieldMatchSearchPrefix(field: string, searchQuery: string): boolean {
  const normalizedField = normalizeNetworkSearchQuery(field)
  const normalizedQuery = normalizeNetworkSearchQuery(searchQuery)

  if (!normalizedField || !normalizedQuery) {
    return false
  }

  const fieldWords = normalizedField.split(' ')
  const queryWords = normalizedQuery.split(' ')

  return fieldWords.some((_, startIndex) =>
    queryWords.every((queryWord, queryIndex) => fieldWords[startIndex + queryIndex]?.startsWith(queryWord)),
  )
}

function doesChainMatchSearchQuery(chainId: UniverseChainId, normalizedSearchQuery: string): boolean {
  if (!normalizedSearchQuery) {
    return true
  }

  const chainInfo = getChainInfo(chainId)
  const searchableFields = [chainInfo.label, chainInfo.interfaceName]

  return searchableFields.some((field) => doesFieldMatchSearchPrefix(field, normalizedSearchQuery))
}

function shouldIncludeAllNetworksOption({
  includeAllNetworks,
  normalizedSearchQuery,
}: {
  includeAllNetworks?: boolean
  normalizedSearchQuery: string
}): boolean {
  if (!includeAllNetworks) {
    return false
  }

  if (!normalizedSearchQuery) {
    return true
  }

  const allNetworksLabel = i18next.t('transaction.network.all')
  return doesFieldMatchSearchPrefix(allNetworksLabel, normalizedSearchQuery)
}

export function filterNetworkOptions({
  chainIds,
  tieredOptions,
  includeAllNetworks,
  searchQuery,
}: FilterNetworkOptionsParams & {
  searchQuery: string
}): FilteredNetworkOptionsResult {
  const normalizedSearchQuery = normalizeNetworkSearchQuery(searchQuery)
  const shouldShowTieredOptions = Boolean(tieredOptions?.withBalances.length)
  const showAllNetworks = shouldIncludeAllNetworksOption({
    includeAllNetworks,
    normalizedSearchQuery,
  })

  if (!normalizedSearchQuery) {
    return {
      filteredChainIds: chainIds,
      filteredTieredOptions: shouldShowTieredOptions ? tieredOptions : undefined,
      showAllNetworks,
    }
  }

  if (!shouldShowTieredOptions || !tieredOptions) {
    const filteredChainIds = chainIds.filter((chainId) => doesChainMatchSearchQuery(chainId, normalizedSearchQuery))

    return {
      filteredChainIds,
      filteredTieredOptions: undefined,
      showAllNetworks,
    }
  }

  const filteredTieredOptions = {
    withBalances: tieredOptions.withBalances.filter((option) =>
      doesChainMatchSearchQuery(option.chainId, normalizedSearchQuery),
    ),
    otherNetworks: tieredOptions.otherNetworks.filter((option) =>
      doesChainMatchSearchQuery(option.chainId, normalizedSearchQuery),
    ),
  }

  return {
    filteredChainIds: [
      ...filteredTieredOptions.withBalances.map((option) => option.chainId),
      ...filteredTieredOptions.otherNetworks.map((option) => option.chainId),
    ],
    filteredTieredOptions,
    showAllNetworks,
  }
}

export function useNetworkFilterSearch({
  chainIds,
  tieredOptions,
  includeAllNetworks,
}: FilterNetworkOptionsParams): UseNetworkFilterSearchResult {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredNetworkOptions = useMemo(
    () => filterNetworkOptions({ chainIds, tieredOptions, includeAllNetworks, searchQuery }),
    [chainIds, includeAllNetworks, tieredOptions, searchQuery],
  )

  return {
    searchQuery,
    setSearchQuery,
    ...filteredNetworkOptions,
  }
}
