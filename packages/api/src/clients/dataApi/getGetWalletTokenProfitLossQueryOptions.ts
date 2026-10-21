import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import type {
  GetWalletTokenProfitLossRequest,
  GetWalletTokenProfitLossResponse,
} from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { type DataApiServiceClient } from '@universe/api/src/clients/dataApi/createDataApiServiceClient'
import { buildWalletAddressKey, type WalletAddressKey } from '@universe/api/src/clients/dataApi/walletAddressKey'
import { transformInput, type WithoutWalletAccount } from '@universe/api/src/connectRpc/utils'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export type GetWalletTokenProfitLossQueryParams = {
  input?: WithoutWalletAccount<PartialMessage<GetWalletTokenProfitLossRequest>> & {
    evmAddress?: string
    svmAddress?: string
  }
}

type GetWalletTokenProfitLossQueryKey = readonly [
  ReactQueryCacheKey.GetWalletTokenProfitLoss,
  WalletAddressKey,
  Record<string, unknown>,
]

/** queryKey + queryFn for DataApiService GetWalletTokenProfitLoss; callers merge in enabled. */
export function getGetWalletTokenProfitLossQueryOptions(
  client: DataApiServiceClient,
  { input }: GetWalletTokenProfitLossQueryParams,
): QueryOptionsResult<
  PlainMessage<GetWalletTokenProfitLossResponse> | undefined,
  Error,
  PlainMessage<GetWalletTokenProfitLossResponse> | undefined,
  GetWalletTokenProfitLossQueryKey
> {
  const transformedInput = transformInput(input)

  const { walletAccount: _walletAccount, ...queryCacheInputs } = transformedInput ?? {}

  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.GetWalletTokenProfitLoss, buildWalletAddressKey(input), queryCacheInputs] as const,
    queryFn: async (): Promise<PlainMessage<GetWalletTokenProfitLossResponse> | undefined> => {
      if (!transformedInput) {
        return undefined
      }
      return toPlainMessage(await client.getWalletTokenProfitLoss(transformedInput))
    },
    staleTime: ONE_MINUTE_MS,
  })
}
