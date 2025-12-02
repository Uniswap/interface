import { useCallback, useEffect, useMemo, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ModalNameType, UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { parseChainFromTokenSearchQuery } from 'uniswap/src/utils/search/parseChainFromTokenSearchQuery'

export function useFilterCallbacks(
  chainId: UniverseChainId | null,
  modalName?: ModalNameType,
): {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string | null
  parsedSearchFilter: string | null
  onChangeChainFilter: (newChainFilter: UniverseChainId | null) => void
  onClearSearchFilter: () => void
  onChangeText: (newSearchFilter: string) => void
} {
  const [chainFilter, setChainFilter] = useState<UniverseChainId | null>(chainId)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)

  const { chains: enabledChains } = useEnabledChains()

  // Parses the user input to determine if the user is searching for a chain + token
  // i.e "eth dai" or "dai eth"
  // parsedChainFilter: 1
  // parsedSearchFilter: "dai"
  const { chainFilter: parsedChainFilter, searchTerm: parsedSearchFilter } = useMemo(() => {
    // If there's already a chain filter set, don't parse chains from search text
    if (chainFilter) {
      return {
        chainFilter: null,
        searchTerm: null,
      }
    }
    return parseChainFromTokenSearchQuery(searchFilter, enabledChains)
  }, [chainFilter, searchFilter, enabledChains])

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback(
    (newChainFilter: typeof chainFilter) => {
      setChainFilter(newChainFilter)
      sendAnalyticsEvent(UniswapEventName.NetworkFilterSelected, {
        chain: newChainFilter ?? 'All',
        modal: modalName,
      })
    },
    [modalName],
  )

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback((newSearchFilter: string) => setSearchFilter(newSearchFilter), [])

  return {
    chainFilter,
    parsedChainFilter,
    searchFilter,
    parsedSearchFilter,
    onChangeChainFilter,
    onClearSearchFilter,
    onChangeText,
  }
}
