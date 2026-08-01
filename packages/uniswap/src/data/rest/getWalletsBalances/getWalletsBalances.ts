import { type PartialMessage, type PlainMessage } from '@bufbuild/protobuf'
import { createPromiseClient } from '@connectrpc/connect'
import { queryOptions, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { DataApiService } from '@uniswap/client-data-api/dist/data/v1/api_connect'
import type {
  GetWalletsBalancesRequest,
  GetWalletsBalancesResponse,
  WalletBalance,
} from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import {
  createDataApiServiceClient,
  fetchWalletsBalances as fetchWalletsBalancesWithClient,
  getGetWalletsBalancesQueryOptions,
  type WithoutWalletAccounts,
} from '@universe/api'
import { entryGatewayPostTransport } from 'uniswap/src/data/rest/base'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type GetWalletsBalancesInput<TSelectData = PlainMessage<GetWalletsBalancesResponse>> = {
  input?: WithoutWalletAccounts<PartialMessage<GetWalletsBalancesRequest>> & {
    wallets?: { evmAddress?: Address; svmAddress?: Address }[]
  }
  enabled?: boolean
  refetchInterval?: number | false
  select?: (data: PlainMessage<GetWalletsBalancesResponse> | undefined) => TSelectData
}

const dataApiClient = createDataApiServiceClient({
  rpcClient: createPromiseClient(DataApiService, entryGatewayPostTransport),
})

/** Batch variant of `useGetWalletBalancesQuery`: one aggregate `WalletBalance` per requested wallet. */
export function useGetWalletsBalancesQuery<TSelectData = PlainMessage<GetWalletsBalancesResponse>>(
  params: GetWalletsBalancesInput<TSelectData>,
): UseQueryResult<TSelectData, Error> {
  return useQuery(getWalletsBalancesQuery(params))
}

type GetWalletsBalancesQueryKey = readonly [
  ReactQueryCacheKey.GetWalletsBalances,
  { evmAddress?: Address; svmAddress?: Address }[],
  Record<string, unknown>,
]

type GetWalletsBalancesQuery<TSelectData = PlainMessage<GetWalletsBalancesResponse>> = QueryOptionsResult<
  PlainMessage<GetWalletsBalancesResponse> | undefined,
  Error,
  TSelectData,
  GetWalletsBalancesQueryKey
>

export const getWalletsBalancesQuery = <TSelectData = PlainMessage<GetWalletsBalancesResponse>>({
  input,
  enabled = true,
  refetchInterval,
  select,
}: GetWalletsBalancesInput<TSelectData>): GetWalletsBalancesQuery<TSelectData> => {
  const baseOptions = getGetWalletsBalancesQueryOptions(dataApiClient, { input })

  // `meta.persist: true` propagates from `baseOptions` for cold-start hydration on mobile + extension.
  return queryOptions({
    ...baseOptions,
    enabled,
    refetchInterval,
    subscribed: !!enabled,
    select,
  })
}

/** Imperative variant for non-hook callers (e.g. onboarding). No query-cache interaction. */
export async function fetchWalletsBalances(
  input: NonNullable<GetWalletsBalancesInput['input']>,
): Promise<PlainMessage<GetWalletsBalancesResponse> | undefined> {
  return fetchWalletsBalancesWithClient(dataApiClient, input)
}

export function toEvmWallets(addresses: Address[]): { evmAddress?: string; svmAddress?: string }[] {
  return addresses.map((address) => ({ evmAddress: address }))
}

function findBalanceForAddress({
  balances,
  address,
}: {
  balances: PlainMessage<WalletBalance>[]
  address: Address
}): PlainMessage<WalletBalance> | undefined {
  return balances.find((balance) =>
    balance.walletAccount?.platformAddresses.some((platformAddress) =>
      areEvmAddressesEqual(address, platformAddress.address),
    ),
  )
}

/**
 * Selector keying totals by the *requested* address spelling (matching is case-insensitive). A wallet
 * whose upstream fetch failed has `total` unset and maps to `undefined` — distinct from an empty wallet, `0`.
 */
export function selectTotalsByRequestedAddress(
  requestedEvmAddresses: Address[],
): (data: PlainMessage<GetWalletsBalancesResponse> | undefined) => AddressTo<number | undefined> | undefined {
  return (data) => {
    if (!data) {
      return undefined
    }
    return requestedEvmAddresses.reduce<AddressTo<number | undefined>>((acc, address) => {
      acc[address] = findBalanceForAddress({ balances: data.balances, address })?.total?.valueUsd
      return acc
    }, {})
  }
}
