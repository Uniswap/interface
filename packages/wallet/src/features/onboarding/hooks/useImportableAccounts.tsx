import { useApolloClient } from '@apollo/client'
import { useCallback, useMemo, useState } from 'react'
import {
  SelectWalletScreenDocument,
  SelectWalletScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useAsyncData } from 'utilities/src/react/hooks'
import { fetchUnitagByAddresses } from 'wallet/src/features/unitags/api'

export interface ImportableAccount {
  ownerAddress: string
  balance: number | undefined
}

function isImportableAccount(account: {
  ownerAddress: string | undefined
  balance: Maybe<number>
}): account is ImportableAccount {
  return (account as ImportableAccount).ownerAddress !== undefined
}

export function useImportableAccounts(importedAddresses?: Address[]): {
  importableAccounts?: ImportableAccount[]
  isLoading: boolean
  showError?: boolean
  refetch: () => void
} {
  const [refetchCount, setRefetchCount] = useState(0)
  const apolloClient = useApolloClient()

  const refetch = useCallback(async () => {
    setRefetchCount((count) => count + 1)
    return refetch()
  }, [])

  const fetch = useCallback(async (): Promise<ImportableAccount[] | undefined> => {
    if (!importedAddresses) {
      return
    }

    const valueModifiers = importedAddresses.map((addr) => ({
      ownerAddress: addr,
      includeSmallBalances: true,
      includeSpamTokens: false,
    }))

    const fetchBalances = apolloClient.query<SelectWalletScreenQuery>({
      query: SelectWalletScreenDocument,
      variables: { ownerAddresses: importedAddresses, valueModifiers },
    })

    const fetchUnitags = fetchUnitagByAddresses(importedAddresses)

    const [balancesResponse, unitagsResponse] = await Promise.all([fetchBalances, fetchUnitags])

    const unitagsByAddress = unitagsResponse?.data

    const allAddressBalances = balancesResponse.data.portfolios

    const importableAccounts = allAddressBalances
      ?.map((address) => ({
        ownerAddress: address?.ownerAddress,
        balance: address?.tokensTotalDenominatedValue?.value,
      }))
      .filter(isImportableAccount)

    const accountsWithBalanceOrUnitag: ImportableAccount[] | undefined = importableAccounts?.filter((address) => {
      const hasBalance = Boolean(address.balance && address.balance > 0)
      const hasUnitag = unitagsByAddress?.[address.ownerAddress] !== undefined
      return hasBalance || hasUnitag
    })

    if (accountsWithBalanceOrUnitag?.length) {
      return accountsWithBalanceOrUnitag
    }

    // If all addresses have 0 total token value and no unitags are associated with any of them, show the first address.
    const firstImportableAccount: ImportableAccount | undefined = importableAccounts?.[0]
    if (firstImportableAccount) {
      return [firstImportableAccount]
    }

    // If query for address balances returned no results, show the first address.
    const firstPendingAddress = importedAddresses[0]
    if (firstPendingAddress) {
      return [{ ownerAddress: firstPendingAddress, balance: undefined }]
    }

    throw new Error('No importable accounts found')

    // We use `refetchCount` as a dependency to manually trigger a refetch when calling the `refetch` function.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importedAddresses, apolloClient, refetchCount])

  const response = useAsyncData(fetch)

  return useMemo(
    () => ({
      importableAccounts: response.data,
      isLoading: response.isLoading || !importedAddresses,
      error: response.error && !response.data?.length,
      refetch,
    }),
    [importedAddresses, refetch, response],
  )
}
