import {
  createFetchClient,
  createUnitagsApiClient,
  getCloudflareApiBaseUrl,
  provideSessionService,
  TrafficFlows,
} from '@universe/api'
import { getConfig } from '@universe/config'
import { getIsSessionServiceEnabled } from '@universe/gating'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const UnitagsApiFetchClient = createFetchClient({
  baseUrl: getConfig().unitagsApiUrlOverride || `${getCloudflareApiBaseUrl(TrafficFlows.Unitags)}/v2/unitags`,
  getSessionService: () =>
    provideSessionService({ getBaseUrl: () => uniswapUrls.apiBaseUrlV2, getIsSessionServiceEnabled }),
})

export const UnitagsApiClient = createUnitagsApiClient({
  fetchClient: UnitagsApiFetchClient,
})
