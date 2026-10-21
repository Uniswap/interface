import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type {
  GetWalletTokensProfitLossRequest,
  GetWalletTokensProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { buildWalletAddressKey, type WalletAddressKey } from '@universe/api/src/clients/dataApi/walletAddressKey'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export type GetWalletTokensProfitLossQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokensProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
}

type GetWalletTokensProfitLossQueryKey = readonly [
  ReactQueryCacheKey.GetWalletTokensProfitLoss,
  WalletAddressKey,
  Record<string, unknown>,
]

/** queryKey + queryFn for DataApiService GetWalletTokensProfitLoss; callers merge in enabled. */
export function getGetWalletTokensProfitLossQueryOptions(
  client: DataApiServiceClient,
  { input }: GetWalletTokensProfitLossQueryParams,
): QueryOptionsResult<
  PlainMessage<GetWalletTokensProfitLossResponse> | undefined,
  Error,
  PlainMessage<GetWalletTokensProfitLossResponse> | undefined,
  GetWalletTokensProfitLossQueryKey
> {
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, ...queryCacheInputs } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss, buildWalletAddressKey(input), queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetWalletTokensProfitLossResponse> | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      return toPlainMessage(await client.getWalletTokensProfitLoss(transformedInput))
    },
    staleTime: ONE_MINUTE_MS,
  })
}
