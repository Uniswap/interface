import { NetworkStatus } from '@apollo/client'
import { AuthData } from 'uniswap/src/data/types'

export function isNonPollingRequestInFlight(networkStatus: NetworkStatus): boolean {
  return (
    networkStatus === NetworkStatus.loading ||
    networkStatus === NetworkStatus.setVariables ||
    networkStatus === NetworkStatus.refetch
  )
}

/**
 * Consider a query in an error state for UI purposes if query has no data, and
 * query has been loading at least once.
 */
export function isError(networkStatus: NetworkStatus, hasData: boolean): boolean {
  return !hasData && networkStatus !== NetworkStatus.loading
}

export const objectToQueryString = (obj: Record<string, string | number | boolean>): string => {
  return Object.entries(obj)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
}

export type SignMessageFunc = (message: string) => Promise<string>
export type SignedRequestParams<T> = {
  data: T
  address: string
  signMessage: SignMessageFunc
}

export async function createSignedRequestBody<T>({
  data,
  address,
  signMessage,
}: SignedRequestParams<T>): Promise<{ requestBody: T & AuthData; signature: string }> {
  const requestBody: T & AuthData = {
    ...data,
    'x-uni-address': address,
    'x-uni-timestamp': Date.now(),
  }
  const message = JSON.stringify(requestBody)
  const signature = await signMessage(message)
  return { requestBody, signature }
}

export async function createSignedRequestParams<T>({
  data,
  address,
  signMessage,
}: SignedRequestParams<T>): Promise<{ requestParams: T & AuthData; signature: string }> {
  const requestParams: T & AuthData = {
    ...data,
    'x-uni-address': address,
    'x-uni-timestamp': Date.now(),
  }
  const message = objectToQueryString(requestParams)
  const signature = await signMessage(message)
  return { requestParams, signature }
}
