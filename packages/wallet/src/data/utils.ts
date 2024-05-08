import { ApolloClient, NetworkStatus, NormalizedCacheObject, useApolloClient } from '@apollo/client'
import { useCallback } from 'react'
import { AuthData } from 'wallet/src/data/types'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { SignerManager } from 'wallet/src/features/wallet/signing/SignerManager'
import { signMessage } from 'wallet/src/features/wallet/signing/signing'

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
  include?: Parameters<ApolloClient<NormalizedCacheObject>['refetchQueries']>[0]['include']
) => void {
  const client = useApolloClient()

  return useCallback(
    async (
      include: Parameters<
        ApolloClient<NormalizedCacheObject>['refetchQueries']
      >[0]['include'] = 'active'
    ) => {
      await client?.refetchQueries({ include })
    },
    [client]
  )
}

export const objectToQueryString = (obj: Record<string, string | number | boolean>): string => {
  return Object.entries(obj)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

export async function createSignedRequestBody<T>(
  data: T,
  account: Account,
  signerManager: SignerManager
): Promise<{ requestBody: T & AuthData; signature: string }> {
  const requestBody: T & AuthData = {
    ...data,
    'x-uni-address': account.address,
    'x-uni-timestamp': Date.now(),
  }
  const message = JSON.stringify(requestBody)
  const signature = await signMessage(message, account, signerManager)
  return { requestBody, signature }
}

export async function createSignedRequestParams<T>(
  params: T,
  account: Account,
  signerManager: SignerManager
): Promise<{ requestParams: T & AuthData; signature: string }> {
  const requestParams: T & AuthData = {
    ...params,
    'x-uni-address': account.address,
    'x-uni-timestamp': Date.now(),
  }
  const message = objectToQueryString(requestParams)
  const signature = await signMessage(message, account, signerManager)
  return { requestParams, signature }
}
