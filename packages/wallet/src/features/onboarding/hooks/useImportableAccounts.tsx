import { useApolloClient } from '@apollo/client'
import { useCallback, useMemo, useState } from 'react'
import {
  SelectWalletScreenDocument,
  SelectWalletScreenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useAsyncData } from 'utilities/src/react/hooks'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { useTimeout } from 'utilities/src/time/timing'
import { useOnboardingContext } from 'wallet/src/features/onboarding/OnboardingContext'
import { NUMBER_OF_WALLETS_TO_IMPORT } from 'wallet/src/features/onboarding/createImportedAccounts'
import { fetchUnitagByAddresses } from 'wallet/src/features/unitags/api'

const FORCED_LOADING_DURATION = 3 * ONE_SECOND_MS // 3s

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

export function useImportableAccounts(): {
  importableAccounts?: ImportableAccount[]
  isLoading: boolean
  showError?: boolean
  refetch: () => void
} {
  const [refetchCount, setRefetchCount] = useState(0)
  const apolloClient = useApolloClient()

  const { getImportedAccountsAddresses } = useOnboardingContext()
  const importedAddresses = getImportedAccountsAddresses()

  const isLoadingAddresses = importedAddresses?.length !== NUMBER_OF_WALLETS_TO_IMPORT

  // Force a fixed duration loading state for smoother transition (as we show different UI for 1 vs multiple wallets)
  const [isForcedLoading, setIsForcedLoading] = useState(true)
  useTimeout(() => setIsForcedLoading(false), FORCED_LOADING_DURATION)

  const refetch = useCallback(async () => {
    setRefetchCount((count) => count + 1)
    setIsForcedLoading(true)
    return refetch()
  }, [])

  const fetch = useCallback(async (): Promise<ImportableAccount[] | undefined> => {
    if (isLoadingAddresses) {
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
  }, [isLoadingAddresses, importedAddresses, apolloClient, refetchCount])

  const response = useAsyncData(fetch)

  return useMemo(
    () => ({
      importableAccounts: response.data,
      isLoading: response.isLoading || isLoadingAddresses || isForcedLoading,
      error: response.error && !response.data?.length,
      refetch,
    }),
    [isForcedLoading, isLoadingAddresses, refetch, response],
  )
}
