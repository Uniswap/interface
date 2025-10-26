import { createFetchClient, createUnitagsApiClient, getCloudflareApiBaseUrl, TrafficFlows } from '@universe/api'
import { getConfig } from '@universe/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const UnitagsApiFetchClient = createFetchClient({
  baseUrl: getConfig().unitagsApiUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Unitags)}/v2/unitags`,
  getSessionServiceBaseUrl: () => uniswapUrls.apiBaseUrlV2,
})

export const UnitagsApiClient = createUnitagsApiClient({
  fetchClient: UnitagsApiFetchClient,
})
