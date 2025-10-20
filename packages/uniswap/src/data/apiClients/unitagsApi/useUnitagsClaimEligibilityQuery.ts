import { skipToken, type UseQueryResult, useQuery } from '@tanstack/react-query'
import {
  type UnitagClaimEligibilityRequest,
  type UnitagClaimEligibilityResponse,
  type UseQueryApiHelperHookArgs,
} from '@universe/api'
import { UnitagsApiClient } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsClaimEligibilityQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  UnitagClaimEligibilityRequest,
  UnitagClaimEligibilityResponse
>): UseQueryResult<UnitagClaimEligibilityResponse> {
  const queryKey = [ReactQueryCacheKey.UnitagsApi, 'claim/eligibility', params]

  return useQuery<UnitagClaimEligibilityResponse>({
    queryKey,
    queryFn: params
      ? async (): Promise<UnitagClaimEligibilityResponse> => await UnitagsApiClient.fetchClaimEligibility(params)
      : skipToken,
    staleTime: 2 * ONE_MINUTE_MS,
    ...rest,
  })
}
