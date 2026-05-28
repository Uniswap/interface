import { PlainMessage } from '@bufbuild/protobuf'
import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import { CanClaimUsernameRequest, CanClaimUsernameResponse, type UseQueryApiHelperHookArgs } from '@universe/api'
import { unitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsClaimEligibilityQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  PlainMessage<CanClaimUsernameRequest>,
  CanClaimUsernameResponse
>): UseQueryResult<CanClaimUsernameResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'claim/eligibility', params]

  return useQuery(
    persistableQueryOptions<CanClaimUsernameResponse>({
      queryKey,
      queryFn: params
        ? async (): Promise<CanClaimUsernameResponse> => {
            const response = await unitagsApiClient.fetchClaimEligibility(params)
            return new CanClaimUsernameResponse({
              canClaim: response.canClaim,
              errorCode: response.errorCode,
            })
          }
        : skipToken,
      staleTime: 2 * ONE_MINUTE_MS,
      ...rest,
    }),
  )
}
