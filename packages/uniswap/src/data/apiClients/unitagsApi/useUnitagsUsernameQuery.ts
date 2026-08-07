import { PlainMessage, toPlainMessage } from '@bufbuild/protobuf'
import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { GetUsernameRequest, GetUsernameResponse } from '@universe/api'
import { UseQueryApiHelperHookArgs } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { getUnitagFormatError } from 'uniswap/src/features/unitags/getUnitagFormatError'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Single source of truth for the username availability query so every caller
 * (useQuery hooks, imperative fetchQuery) shares the same cache key and value shape.
 */
export function getUnitagsUsernameQueryOptions(
  params: PlainMessage<GetUsernameRequest> | undefined,
): ReturnType<typeof persistableQueryOptions<PlainMessage<GetUsernameResponse>>> {
  return persistableQueryOptions<PlainMessage<GetUsernameResponse>>({
    queryKey: [ReactQueryCacheKey.UnitagsApi, 'username', params],
    // toPlainMessage strips the Message prototype so the value survives disk persistence.
    queryFn: async (): Promise<PlainMessage<GetUsernameResponse>> => {
      if (!params) {
        throw new Error('params required')
      }
      const response = await unitagsApiClient.fetchUsername(params)
      return toPlainMessage(
        new GetUsernameResponse({
          available: response.available,
          requiresEnsMatch: response.requiresEnsMatch,
          username: response.username,
          metadata: response.metadata,
          address: response.address,
        }),
      )
    },
    staleTime: ONE_MINUTE_MS,
    gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
  })
}

export function useUnitagsUsernameQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<PlainMessage<GetUsernameRequest>, PlainMessage<GetUsernameResponse>>): UseQueryResult<
  PlainMessage<GetUsernameResponse>
> {
  const { t } = useTranslation()

  const formatError = params?.username ? getUnitagFormatError(params.username, t) : undefined
  const shouldQueryForUnitag = params && formatError === undefined

  const options = getUnitagsUsernameQueryOptions(params)

  return useQuery({
    ...options,
    queryFn: shouldQueryForUnitag ? options.queryFn : skipToken,
    ...rest,
  })
}
