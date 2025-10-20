import { useApolloClient } from '@apollo/client'
import { useQuery } from '@tanstack/react-query'
import { GraphQLApi } from '@universe/api'
import { useCallback, useMemo, useState } from 'react'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'

import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENSName } from 'uniswap/src/features/ens/api'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { NUMBER_OF_WALLETS_TO_GENERATE } from 'wallet/src/features/onboarding/OnboardingContext'

export interface AddressWithBalanceAndName {
  address: string
  balance?: number
  unitag?: string
  ensName?: string
}

export function hasBalanceOrName(a: AddressWithBalanceAndName): boolean {
  return Boolean((a.balance && a.balance > 0) || a.ensName || a.unitag)
}

export function useImportableAccounts(importedAddresses?: Address[]): {
  importableAccounts?: AddressWithBalanceAndName[]
  isLoading: boolean
  showError?: boolean
  refetch: () => void
} {
  const isLoadingAddresses = importedAddresses?.length !== NUMBER_OF_WALLETS_TO_GENERATE

  const { addressInfoMap, isLoading, showError, refetch } = useAddressesBalanceAndNames(
    isLoadingAddresses ? undefined : importedAddresses,
  )

  const accountsWithBalanceOrName = useMemo(
    () => Object.values(addressInfoMap ?? {}).filter(hasBalanceOrName),
    [addressInfoMap],
  )

  const importableAccounts: AddressWithBalanceAndName[] | undefined = useMemo(() => {
    if (accountsWithBalanceOrName.length > 0) {
      // If there's accounts of significance, return them
      return accountsWithBalanceOrName
    } else if (!isLoading && importedAddresses && importedAddresses[0]) {
      // if there's no significant accounts, return the first address
      return [{ address: importedAddresses[0] }]
    } else if (!isLoading && !importedAddresses?.length) {
      throw new Error('No imported addresses found')
    } else {
      // otherwise return undefined, still loading
      return undefined
    }
  }, [accountsWithBalanceOrName, importedAddresses, isLoading])

  return {
    importableAccounts,
    isLoading,
    showError,
    refetch,
  }
}

export function useAddressesBalanceAndNames(addresses?: Address[]): {
  addressInfoMap?: AddressTo<AddressWithBalanceAndName>
  isLoading: boolean
  showError?: boolean
  refetch: () => void
} {
  const [refetchCount, setRefetchCount] = useState(0)
  const apolloClient = useApolloClient()

  const addressesArray = useMemo(() => (addresses ? addresses : []), [addresses])

  const isLoadingAddresses = addressesArray.length === 0

  const refetch = useCallback(async () => {
    setRefetchCount((count) => count + 1)
    return refetch()
  }, [])

  const { ensMap, loading: ensLoading } = useAddressesEnsNames(addressesArray)

  const { gqlChains } = useEnabledChains()

  // biome-ignore lint/correctness/useExhaustiveDependencies: -refetchCount
  const fetchBalanceAndUnitags = useCallback(async (): Promise<AddressTo<AddressWithBalanceAndName> | undefined> => {
    if (addressesArray.length === 0) {
      return undefined
    }

    const valueModifiers = addressesArray.map((addr) => ({
      ownerAddress: addr,
      includeSmallBalances: true,
      includeSpamTokens: false,
    }))

    const fetchBalances = apolloClient.query<GraphQLApi.SelectWalletScreenQuery>({
      query: GraphQLApi.SelectWalletScreenDocument,
      variables: { ownerAddresses: addressesArray, chains: gqlChains, valueModifiers },
    })

    const fetchUnitags = UnitagsApiClient.fetchUnitagsByAddresses({ addresses: addressesArray })

    const [balancesResponse, unitagsResponse] = await Promise.all([fetchBalances, fetchUnitags])

    const unitagsByAddress = unitagsResponse.usernames

    const balancesByAddress = (balancesResponse.data.portfolios ?? []).reduce(
      (balances: AddressTo<number | undefined>, portfolios): AddressTo<number | undefined> => {
        if (portfolios?.ownerAddress) {
          balances[portfolios.ownerAddress] = portfolios.tokensTotalDenominatedValue?.value
        }
        return balances
      },
      {},
    )

    const dataMap: AddressTo<AddressWithBalanceAndName> = addressesArray.reduce(
      (map, address) => {
        const entry = {
          address,
          balance: balancesByAddress[address],
          unitag: unitagsByAddress[address]?.username,
        }
        map[entry.address] = entry
        return map
      },
      {} as AddressTo<AddressWithBalanceAndName>,
    )

    return dataMap

    // We use `refetchCount` as a dependency to manually trigger a refetch when calling the `refetch` function.
  }, [addressesArray, apolloClient, refetchCount, gqlChains])

  const {
    data: balanceAndUnitags,
    isLoading: balanceAndUnitagsLoading,
    error: fetchingError,
  } = useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.BalanceAndUnitags, addressesArray],
      queryFn: fetchBalanceAndUnitags,
    }),
  )

  const addressInfoMap = useMemo(() => {
    if (balanceAndUnitags === undefined) {
      return undefined
    } else {
      const res: AddressTo<AddressWithBalanceAndName> = {}
      Object.entries(balanceAndUnitags).forEach(([address, info]) => {
        res[address] = {
          ...info,
          ensName: ensMap && ensMap[address],
        }
      })
      return res
    }
  }, [balanceAndUnitags, ensMap])

  return useMemo(
    () => ({
      addressInfoMap,
      // This function is loading if we don't have addresses or are waiting on data. The first two are data, the
      // last two cases occur when we are waiting for addresses
      isLoading: balanceAndUnitagsLoading || ensLoading || isLoadingAddresses || addressInfoMap === undefined,
      error: fetchingError && !balanceAndUnitags?.length,
      refetch,
    }),
    [
      addressInfoMap,
      balanceAndUnitags,
      balanceAndUnitagsLoading,
      ensLoading,
      fetchingError,
      isLoadingAddresses,
      refetch,
    ],
  )
}

export function useAddressesEnsNames(addresses: Address[]): {
  loading: boolean
  ensMap?: AddressTo<string>
} {
  // Need to fetch ENS names for each derivation index
  const ensNameStates: Array<ReturnType<typeof useENSName> | undefined> = useMemo(
    () => Array(NUMBER_OF_WALLETS_TO_GENERATE) as undefined[],
    [],
  )

  ensNameStates[0] = useENSName(addresses[0])
  ensNameStates[1] = useENSName(addresses[1])
  ensNameStates[2] = useENSName(addresses[2])
  ensNameStates[3] = useENSName(addresses[3])
  ensNameStates[4] = useENSName(addresses[4])
  ensNameStates[5] = useENSName(addresses[5])
  ensNameStates[6] = useENSName(addresses[6])
  ensNameStates[7] = useENSName(addresses[7])
  ensNameStates[8] = useENSName(addresses[8])
  ensNameStates[9] = useENSName(addresses[9])

  // Using these values to recalculate dependency array
  const ensLoading = ensNameStates.some((ensState) => ensState?.isLoading)

  const nameMap = useMemo((): AddressTo<string> => {
    // skip if not all loaded
    if (ensLoading) {
      return {}
    }

    // eslint-disable-next-line max-params
    return addresses.reduce((map: AddressTo<string>, address: string, index: number) => {
      const nameData = ensNameStates[index]?.data
      if (nameData) {
        map[address] = nameData
      }
      return map
    }, {})
  }, [addresses, ensLoading, ensNameStates])

  return {
    ensMap: ensLoading ? undefined : nameMap,
    loading: ensLoading,
  }
}
