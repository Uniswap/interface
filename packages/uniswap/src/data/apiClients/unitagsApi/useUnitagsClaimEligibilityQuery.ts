import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { fetchClaimEligibility } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { UnitagClaimEligibilityRequest, UnitagClaimEligibilityResponse } from 'uniswap/src/features/unitags/types'
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
      ? async (): ReturnType<typeof fetchClaimEligibility> => await fetchClaimEligibility(params)
      : skipToken,
    staleTime: 2 * ONE_MINUTE_MS,
    ...rest,
  })
}
