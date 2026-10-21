import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type {
  GetWalletProfitLossRequest,
  GetWalletProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { buildWalletAddressKey, type WalletAddressKey } from '@universe/api/src/clients/dataApi/walletAddressKey'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export type GetWalletProfitLossQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
}

type GetWalletProfitLossQueryKey = readonly [
  ReactQueryCacheKey.GetWalletProfitLoss,
  WalletAddressKey,
  Record<string, unknown>,
]

/** queryKey + queryFn for DataApiService GetWalletProfitLoss; callers merge in enabled, refetchInterval. */
export function getGetWalletProfitLossQueryOptions(
  client: DataApiServiceClient,
  { input }: GetWalletProfitLossQueryParams,
): QueryOptionsResult<
  PlainMessage<GetWalletProfitLossResponse> | undefined,
  Error,
  PlainMessage<GetWalletProfitLossResponse> | undefined,
  GetWalletProfitLossQueryKey
> {
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, since, till, ...restInputs } = transformedInput ?? {}
  // bigint timestamps are stringified so the key survives persistence (JSON.stringify rejects bigint).
  const queryCacheInputs: Record<string, unknown> = { ...restInputs, since: since?.toString(), till: till?.toString() }

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetWalletProfitLoss, buildWalletAddressKey(input), queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetWalletProfitLossResponse> | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      return toPlainMessage(await client.getWalletProfitLoss(transformedInput))
    },
    staleTime: ONE_MINUTE_MS,
  })
}
