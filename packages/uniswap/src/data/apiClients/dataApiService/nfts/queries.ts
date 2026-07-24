import { type PartialMessage, type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { type InfiniteData } from '@tanstack/react-query'
import { GetWalletNftsRequest, GetWalletNftsResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApi/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableInfiniteQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

export type GetWalletNftsInput = {
  params?: Omit<PartialMessage<GetWalletNftsRequest>, 'page'> & { pageSize?: number }
  refetchInterval?: number
  enabled?: boolean
}

type GetWalletNftsQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'getWalletNfts', GetWalletNftsInput['params']]

export function getGetWalletNftsQueryOptions({
  params,
  enabled,
  refetchInterval,
}: GetWalletNftsInput): ReturnType<
  typeof persistableInfiniteQueryOptions<
    PlainMessage<GetWalletNftsResponse>,
    Error,
    InfiniteData<PlainMessage<GetWalletNftsResponse>, string>,
    GetWalletNftsQueryKey,
    string
  >
> {
  return persistableInfiniteQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'getWalletNfts', params] as const,
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async ({ pageParam }: { pageParam: string }): Promise<PlainMessage<GetWalletNftsResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      return toPlainMessage(
        await dataApiServiceClientV2.getWalletNfts({
          ...params,
          page: { pageToken: pageParam, pageSize: params.pageSize },
        }),
      )
    },
    initialPageParam: '',
    getNextPageParam: (lastPage: PlainMessage<GetWalletNftsResponse>) => lastPage.page?.nextPageToken || undefined,
    enabled,
    refetchInterval,
  })
}
