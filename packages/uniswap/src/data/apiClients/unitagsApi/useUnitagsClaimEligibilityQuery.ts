import { UseQueryResult, skipToken, useQuery } from '@tanstack/react-query'
import { UseQueryApiHelperHookArgs } from 'uniswap/src/data/apiClients/types'
import { UNITAGS_API_CACHE_KEY, fetchClaimEligibility } from 'uniswap/src/data/apiClients/unitagsApi/UnitagsApiClient'
import { UnitagClaimEligibilityRequest, UnitagClaimEligibilityResponse } from 'uniswap/src/features/unitags/types'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useUnitagsClaimEligibilityQuery({
  params,
  ...rest
}: UseQueryApiHelperHookArgs<
  UnitagClaimEligibilityRequest,
  UnitagClaimEligibilityResponse
>): UseQueryResult<UnitagClaimEligibilityResponse> {
  const queryKey = [UNITAGS_API_CACHE_KEY, 'claim/eligibility', params]

  return useQuery<UnitagClaimEligibilityResponse>({
    queryKey,
    queryFn: params
      ? async (): ReturnType<typeof fetchClaimEligibility> => await fetchClaimEligibility(params)
      : skipToken,
    staleTime: 2 * ONE_MINUTE_MS,
    ...rest,
  })
}
