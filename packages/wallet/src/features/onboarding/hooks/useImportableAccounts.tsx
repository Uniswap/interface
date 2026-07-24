import { useQuery } from '@tanstack/react-query'
import { useCallback, useMemo, useState } from 'react'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useENSName } from 'uniswap/src/features/ens/api'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { queryWithoutCache } from 'utilities/src/reactQuery/queryOptions'
import { NUMBER_OF_WALLETS_TO_GENERATE } from 'wallet/src/features/onboarding/constants'
import { fetchBalancesAndUnitags } from 'wallet/src/features/onboarding/fetchBalancesAndUnitags'

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

  const addressesArray = useMemo(() => (addresses ? addresses : []), [addresses])

  const isLoadingAddresses = addressesArray.length === 0

  const refetch = useCallback(() => {
    setRefetchCount((count) => count + 1)
  }, [])

  const { ensMap } = useAddressesEnsNames(addressesArray)

  const { chains: chainIds } = useEnabledChains()

  const fetchBalanceAndUnitags = useCallback(async (): Promise<AddressTo<AddressWithBalanceAndName>> => {
    const { balanceByAddress, unitagByAddress } = await fetchBalancesAndUnitags({
      addresses: addressesArray,
      chainIds,
    })

    return addressesArray.reduce((map, address) => {
      map[address] = {
        address,
        balance: balanceByAddress[address],
        unitag: unitagByAddress[address]?.username,
      }
      return map
    }, {} as AddressTo<AddressWithBalanceAndName>)

    // We use `refetchCount` as a dependency to manually trigger a refetch when calling the `refetch` function.
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [addressesArray, refetchCount, chainIds])

  const {
    data: balanceAndUnitags,
    isLoading: balanceAndUnitagsLoading,
    error: fetchingError,
  } = useQuery(
    queryWithoutCache({
      queryKey: [ReactQueryCacheKey.BalanceAndUnitags, addressesArray],
      queryFn: fetchBalanceAndUnitags,
      enabled: !isLoadingAddresses,
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
      isLoading: balanceAndUnitagsLoading || isLoadingAddresses,
      showError: !!fetchingError && Object.keys(balanceAndUnitags ?? {}).length === 0,
      refetch,
    }),
    [addressInfoMap, balanceAndUnitags, balanceAndUnitagsLoading, fetchingError, isLoadingAddresses, refetch],
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

    // oxlint-disable-next-line max-params
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
