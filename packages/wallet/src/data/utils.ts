import { ApolloClient, NetworkStatus, NormalizedCacheObject, useApolloClient } from '@apollo/client'
import { useCallback } from 'react'
import { OnRampTransactionsAuth } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { createSignedRequestParams, objectToQueryString } from 'uniswap/src/data/utils'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { generateSignerFunc } from 'wallet/src/features/wallet/signing/utils'

export const ON_RAMP_AUTH_MAX_LIMIT = 100
export const ON_RAMP_AUTH_MIN_LIMIT = 1

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus): boolean {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

export function isWarmLoadingStatus(networkStatus: NetworkStatus): boolean {
  return networkStatus === NetworkStatus.loading
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}

export function useRefetchQueries(): (
  include?: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include'],
) => void {
  const client = useApolloClient()

  return useCallback(
    async (include: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include'] = 'active') => {
      await client?.refetchQueries({ include })
    },
    [client],
  )
}

export async function createOnRampTransactionsAuth(
  limit: number,
  account: Account,
  signerManager: SignerManager,
): Promise<OnRampTransactionsAuth> {
  const { requestParams, signature } = await createSignedRequestParams({
    data: { limit }, // Parameter needed by graphql server when fetching onramp transactions
    address: account.address,
    signMessage: generateSignerFunc(account, signerManager),
  })
  return { queryParams: objectToQueryString(requestParams), signature }
}
