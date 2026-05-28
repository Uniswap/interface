import { PlainMessage } from '@bufbuild/protobuf'
import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { GetUsernameRequest, GetUsernameResponse } from '@universe/api'
import { UseQueryApiHelperHookArgs } from '@universe/api'
import { useTranslation } from 'react-i18next'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { getUnitagFormatError } from 'uniswap/src/features/unitags/getUnitagFormatError'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { MAX_REACT_QUERY_CACHE_TIME_MS, ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsUsernameQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  PlainMessage<GetUsernameRequest>,
  GetUsernameResponse
>): UseQueryResult<GetUsernameResponse> {
  const { t } = useTranslation()
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'username', params]

  const formatError = params?.username ? getUnitagFormatError(params.username, t) : undefined
  const shouldQueryForUnitag = params && formatError === undefined

  return useQuery(
    persistableQueryOptions<GetUsernameResponse>({
      queryKey,
      queryFn: shouldQueryForUnitag
        ? async (): Promise<GetUsernameResponse> => {
            const response = await unitagsApiClient.fetchUsername(params)
            return new GetUsernameResponse({
              available: response.available,
              requiresEnsMatch: response.requiresEnsMatch,
              username: response.username,
              metadata: response.metadata,
              address: response.address,
            })
          }
        : skipToken,
      staleTime: ONE_MINUTE_MS,
      gcTime: MAX_REACT_QUERY_CACHE_TIME_MS,
      ...rest,
    }),
  )
}
