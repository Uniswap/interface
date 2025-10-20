import { useCallback, useEffect, useState } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { ModalNameType, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

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
  const [parsedChainFilter, setParsedChainFilter] = useState<UniverseChainId | null>(null)
  const [searchFilter, setSearchFilter] = useState<string | null>(null)
  const [parsedSearchFilter, setParsedSearchFilter] = useState<string | null>(null)

  const { chains: enabledChains } = useEnabledChains()

  // Parses the user input to determine if the user is searching for a chain + token
  // i.e "eth dai" or "dai eth"
  // parsedChainFilter: 1
  // parsedSearchFilter: "dai"
  useEffect(() => {
    const sanitizedSearch = searchFilter?.trim().replace('  ', ' ')
    const splitSearch = sanitizedSearch?.split(' ')
    if (!splitSearch || splitSearch.length < 2) {
      setParsedChainFilter(null)
      setParsedSearchFilter(null)
      return
    }

    const firstWord = splitSearch[0]?.toLowerCase()
    const lastWord = splitSearch[splitSearch.length - 1]?.toLowerCase()

    const firstWordChainMatch = firstWord ? getMatchingChainId(firstWord, enabledChains) : undefined
    const lastWordChainMatch = lastWord ? getMatchingChainId(lastWord, enabledChains) : undefined

    if (!chainFilter && firstWordChainMatch) {
      // First word is chain, rest is search term
      const search = splitSearch.slice(1).join(' ')
      if (search) {
        setParsedChainFilter(firstWordChainMatch)
        setParsedSearchFilter(search)
        return
      }
    }

    if (!chainFilter && lastWordChainMatch && !firstWordChainMatch) {
      // Last word is chain, preceding words are search term
      const search = splitSearch.slice(0, -1).join(' ')
      if (search) {
        setParsedChainFilter(lastWordChainMatch)
        setParsedSearchFilter(search)
        return
      }
    }

    setParsedChainFilter(null)
    setParsedSearchFilter(null)
  }, [searchFilter, chainFilter, enabledChains])

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback(
    (newChainFilter: typeof chainFilter) => {
      setChainFilter(newChainFilter)
      sendAnalyticsEvent(WalletEventName.NetworkFilterSelected, {
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

/**
 * Finds a matching chain ID based on the provided chain name.
 *
 * @param maybeChainName - The potential chain name to match against
 * @param enabledChains - Array of enabled chain IDs to search within
 * @returns The matching UniverseChainId or undefined if no match found
 */
const getMatchingChainId = (maybeChainName: string, enabledChains: UniverseChainId[]): UniverseChainId | undefined => {
  const lowerCaseChainName = maybeChainName.toLowerCase()

  for (const chainId of enabledChains) {
    if (isTestnetChain(chainId)) {
      continue
    }

    const chainInfo = getChainInfo(chainId)

    // Check against native currency name
    const nativeCurrencyName = chainInfo.nativeCurrency.name.toLowerCase()
    const firstWord = nativeCurrencyName.split(' ')[0]

    if (firstWord === lowerCaseChainName) {
      return chainId
    }

    // Check against interface name
    const interfaceName = chainInfo.interfaceName.toLowerCase()
    if (interfaceName === lowerCaseChainName) {
      return chainId
    }
  }

  return undefined
}
