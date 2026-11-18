import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { keepPreviousData } from '@tanstack/react-query'
import { type ConvertFiatRequest, type ConvertFiatResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'
import { type DataApiServiceClientV2 } from '../../clients/createDataApiServiceClientV2'

export type ConvertFiatInput = {
  params: PlainMessage<ConvertFiatRequest>
  enabled?: boolean
  refetchInterval?: number
}

type ConvertFiatQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'convertFiat', PlainMessage<ConvertFiatRequest>]

export function getConvertFiatQueryOptions(
  client: DataApiServiceClientV2,
  { params, enabled = true, refetchInterval }: ConvertFiatInput,
): QueryOptionsResult<
  PlainMessage<ConvertFiatResponse>,
  Error,
  PlainMessage<ConvertFiatResponse>,
  ConvertFiatQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'convertFiat', params] as const,
    queryFn: async (): Promise<PlainMessage<ConvertFiatResponse>> => {
      return toPlainMessage(await client.convertFiat(params))
    },
    enabled,
    refetchInterval,
    placeholderData: keepPreviousData,
  })
}
