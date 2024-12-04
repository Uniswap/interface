import { useCallback, useEffect, useState } from 'react'
import { TokenSelectorFlow } from 'uniswap/src/components/TokenSelector/types'
import { flowToModalName } from 'uniswap/src/components/TokenSelector/utils'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isTestnetChain } from 'uniswap/src/features/chains/utils'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function useFilterCallbacks(
  chainId: UniverseChainId | null,
  flow: TokenSelectorFlow,
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
  // i.e "eth dai"
  // parsedChainFilter: 1
  // parsedSearchFilter: "dai"
  useEffect(() => {
    const splitSearch = searchFilter?.split(' ')
    const maybeChainName = splitSearch?.[0]?.toLowerCase()

    const chainMatch = getNativeCurrencyNames(enabledChains).find((currency) =>
      currency.name.startsWith(maybeChainName ?? ''),
    )
    const search = splitSearch?.slice(1).join(' ')

    if (!chainFilter && chainMatch && search) {
      setParsedChainFilter(chainMatch.chainId)
      setParsedSearchFilter(search)
    } else {
      setParsedChainFilter(null)
      setParsedSearchFilter(null)
    }
  }, [searchFilter, chainFilter, enabledChains])

  useEffect(() => {
    setChainFilter(chainId)
  }, [chainId])

  const onChangeChainFilter = useCallback(
    (newChainFilter: typeof chainFilter) => {
      setChainFilter(newChainFilter)
      sendAnalyticsEvent(WalletEventName.NetworkFilterSelected, {
        chain: newChainFilter ?? 'All',
        modal: flowToModalName(flow),
      })
    },
    [flow],
  )

  const onClearSearchFilter = useCallback(() => {
    setSearchFilter(null)
  }, [])

  const onChangeText = useCallback((newSearchFilter: string) => setSearchFilter(newSearchFilter), [setSearchFilter])

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

const getNativeCurrencyNames = (chains: UniverseChainId[]): { chainId: UniverseChainId; name: string }[] =>
  chains
    .map((chainId) => {
      return isTestnetChain(chainId)
        ? false
        : {
            chainId,
            name: getChainInfo(chainId).nativeCurrency.name.toLowerCase(),
          }
    })
    .filter(Boolean) as { chainId: UniverseChainId; name: string }[]
