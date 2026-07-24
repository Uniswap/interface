import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type {
  GetWalletsBalancesRequest,
  GetWalletsBalancesResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { transformWalletsInput, type WithoutWalletAccounts } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

/** Mirrors the BE `MAX_WALLET_BALANCES_BATCH_SIZE`; larger requests are rejected with a 400. */
const MAX_WALLETS_PER_REQUEST = 20

/** Input used to build queryKey and queryFn. Config (enabled, refetchInterval, select) is applied by the caller. */
export type GetWalletsBalancesQueryParams = {
  input?: WithoutWalletAccounts<PartialMessage<GetWalletsBalancesRequest>> & {
    wallets?: { evmAddress?: string; svmAddress?: string }[]
  }
}

type GetWalletsBalancesQueryKey = readonly [
  ReactQueryCacheKey.GetWalletsBalances,
  { evmAddress?: string; svmAddress?: string }[],
  Record<string, unknown>,
]

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}

/**
 * Fetches balances for the given wallets, splitting into batches of `MAX_WALLETS_PER_REQUEST` to
 * respect the BE cap. Responses are index-aligned, so concatenating the chunks preserves wallet order.
 */
export async function fetchWalletsBalances(
  client: DataApiServiceClient,
  input: NonNullable<GetWalletsBalancesQueryParams['input']>,
): Promise<PlainMessage<GetWalletsBalancesResponse> | undefined> {
  const transformedInput = transformWalletsInput(input)

  if (!transformedInput || transformedInput.walletAccounts.length === 0) {
    return undefined
  }

  const { walletAccounts, ...sharedInput } = transformedInput

  const responses = await Promise.all(
    chunkArray(walletAccounts, MAX_WALLETS_PER_REQUEST).map((chunk) =>
      client.getWalletsBalances({ ...sharedInput, walletAccounts: chunk } as PartialMessage<GetWalletsBalancesRequest>),
    ),
  )

  return {
    balances: responses.flatMap((response) => toPlainMessage(response).balances),
  }
}

/**
 * Returns React Query options for DataApiService GetWalletsBalances (queryKey, queryFn, placeholderData only).
 * Callers should merge in config (enabled, refetchInterval, select) when building the final options.
 */
export function getGetWalletsBalancesQueryOptions(
  client: DataApiServiceClient,
  { input }: GetWalletsBalancesQueryParams,
): QueryOptionsResult<
  PlainMessage<GetWalletsBalancesResponse> | undefined,
  Error,
  PlainMessage<GetWalletsBalancesResponse> | undefined,
  GetWalletsBalancesQueryKey
> {
  const { wallets, modifiers: _modifiers, ...queryCacheInputs } = input ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetWalletsBalances, wallets ?? [], queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetWalletsBalancesResponse> | undefined> => {
      if (!input) {
        return undefined
      }
      return fetchWalletsBalances(client, input)
    },
    placeholderData: (prev: PlainMessage<GetWalletsBalancesResponse> | undefined) => prev,
  })
}
