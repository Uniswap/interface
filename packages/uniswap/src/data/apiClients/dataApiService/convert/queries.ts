import { type PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { keepPreviousData } from '@tanstack/react-query'
import { ConvertFiatRequest, ConvertFiatResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { DataApiV2ServiceClient } from 'uniswap/src/data/apiClients/dataApi/DataApiClientV2'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { type QueryOptionsResult } from 'utilities/src/reactQuery/queryOptions'

export type ConvertFiatInput = {
  params: PlainMessage<ConvertFiatRequest>
  enabled?: boolean
}

type ConvertFiatQueryKey = readonly [ReactQueryCacheKey.DataApiService, 'convertFiat', PlainMessage<ConvertFiatRequest>]

export function getConvertFiatQueryOptions({
  params,
  enabled = true,
}: ConvertFiatInput): QueryOptionsResult<
  PlainMessage<ConvertFiatResponse>,
  Error,
  PlainMessage<ConvertFiatResponse>,
  ConvertFiatQueryKey
> {
  return persistableQueryOptions({
    queryKey: [ReactQueryCacheKey.DataApiService, 'convertFiat', params] as const,
    queryFn: async (): Promise<PlainMessage<ConvertFiatResponse>> => {
      return toPlainMessage(await DataApiV2ServiceClient.convertFiat(params))
    },
    enabled,
    refetchInterval: PollingInterval.Slow,
    placeholderData: keepPreviousData,
  })
}
