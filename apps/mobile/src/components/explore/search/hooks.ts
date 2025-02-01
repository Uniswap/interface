import { useMemo } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { ENS_SUFFIX } from 'uniswap/src/features/ens/constants'
import { useENS } from 'uniswap/src/features/ens/useENS'
import { SearchResultType, WalletSearchResult } from 'uniswap/src/features/search/SearchResult'
import { useUnitagByAddress, useUnitagByName } from 'uniswap/src/features/unitags/hooks'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { useIsSmartContractAddress } from 'wallet/src/features/transactions/send/hooks/useIsSmartContractAddress'

// eslint-disable-next-line complexity
export function useWalletSearchResults(
  query: string,
  selectedChain: UniverseChainId | null,
): {
  wallets: WalletSearchResult[]
  loading: boolean
  exactENSMatch: boolean
  exactUnitagMatch: boolean
} {
  const { defaultChainId } = useEnabledChains()
  const validAddress: Address | undefined = useMemo(() => getValidAddress(query, true, false) ?? undefined, [query])

  const querySkippedIfValidAddress = validAddress ? null : query

  // Search for matching .eth if not a valid address
  const {
    address: dotEthAddress,
    name: dotEthName,
    loading: dotEthLoading,
  } = useENS({ nameOrAddress: querySkippedIfValidAddress, autocompleteDomain: true })

  // Search for exact match for ENS if not a valid address
  const {
    address: ensAddress,
    name: ensName,
    loading: ensLoading,
  } = useENS({ nameOrAddress: querySkippedIfValidAddress, autocompleteDomain: false })

  // Search for matching Unitag by name
  const { unitag: unitagByName, loading: unitagLoading } = useUnitagByName(query)

  // Search for matching Unitag by address
  const { unitag: unitagByAddress, loading: unitagByAddressLoading } = useUnitagByAddress(validAddress)

  // Search for matching EOA wallet address
  const { isSmartContractAddress, loading: loadingIsSmartContractAddress } = useIsSmartContractAddress(
    validAddress,
    selectedChain ?? defaultChainId,
  )

  const hasENSResult = dotEthName && dotEthAddress
  const hasEOAResult = validAddress && !isSmartContractAddress

  // Consider when to show sections

  // Only consider queries with the .eth suffix as an exact ENS match
  const exactENSMatch = dotEthName?.toLowerCase() === query.toLowerCase() && query.includes(ENS_SUFFIX)

  const results: WalletSearchResult[] = []

  // Prioritize unitags

  if (unitagByName?.address?.address && unitagByName?.username) {
    results.push({
      type: SearchResultType.Unitag,
      address: unitagByName.address.address,
      unitag: unitagByName.username,
    })
  }

  // Add full address if relevant
  if (unitagByAddress?.username && validAddress) {
    results.push({
      type: SearchResultType.Unitag,
      address: validAddress,
      unitag: unitagByAddress.username,
    })
  }

  // Add the raw ENS result if available and a unitag by address was not already added
  if (!validAddress && ensAddress && ensName && !unitagByAddress?.username) {
    results.push({
      type: SearchResultType.ENSAddress,
      address: ensAddress,
      ensName,
      isRawName: !ensName.endsWith(ENS_SUFFIX), // Ensure raw name is used for subdomains only
    })
  }

  // Add ENS result if it's different than the unitag result and raw ENS result
  if (
    !validAddress &&
    hasENSResult &&
    dotEthAddress !== unitagByName?.address?.address &&
    dotEthAddress !== ensAddress
  ) {
    results.push({
      type: SearchResultType.ENSAddress,
      address: dotEthAddress,
      ensName: dotEthName,
    })
  }

  // Do not show EOA address result if there is a Unitag result by address
  if (hasEOAResult && !unitagByAddress?.username) {
    results.push({
      type: SearchResultType.WalletByAddress,
      address: validAddress,
    })
  }

  // Ensure loading is returned
  const walletsLoading =
    dotEthLoading || ensLoading || loadingIsSmartContractAddress || unitagLoading || unitagByAddressLoading

  return {
    loading: walletsLoading,
    wallets: results,
    exactENSMatch,
    exactUnitagMatch: !!(unitagByName || unitagByAddress),
  }
}
