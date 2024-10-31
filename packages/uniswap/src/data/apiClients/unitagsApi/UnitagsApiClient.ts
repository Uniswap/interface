import { uniswapUrls } from 'uniswap/src/constants/urls'
import { createApiClient } from 'uniswap/src/data/apiClients/createApiClient'
import {
  UnitagAddressRequest,
  UnitagAddressResponse,
  UnitagClaimEligibilityRequest,
  UnitagClaimEligibilityResponse,
  UnitagUsernameRequest,
  UnitagUsernameResponse,
} from 'uniswap/src/features/unitags/types'

export const UNITAGS_API_CACHE_KEY = 'UnitagsApi'

const UnitagsApiClient = createApiClient({
  baseUrl: uniswapUrls.unitagsApiUrl,
})

export async function fetchUsername(params: UnitagUsernameRequest): Promise<UnitagUsernameResponse> {
  return await UnitagsApiClient.get<UnitagUsernameResponse>('/username', { params })
}

export async function fetchAddress(params: UnitagAddressRequest): Promise<UnitagAddressResponse> {
  return await UnitagsApiClient.get<UnitagAddressResponse>('/address', { params })
}

export async function fetchClaimEligibility(
  params: UnitagClaimEligibilityRequest,
): Promise<UnitagClaimEligibilityResponse> {
  return await UnitagsApiClient.get<UnitagClaimEligibilityResponse>('/claim/eligibility', { params })
}
