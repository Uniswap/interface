import { createFetchClient, type FetchClient, provideSessionService } from '@universe/api'
import { getIsSessionServiceEnabled } from '@universe/gating'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/constants'
import { isMobileApp, isWebApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

export const BASE_UNISWAP_HEADERS = {
  'x-request-source': REQUEST_SOURCE,
  ...(!isWebApp ? { 'x-app-version': getVersionHeader() } : {}),
  ...(isMobileApp ? { Origin: uniswapUrls.apiOrigin } : {}),
}

export function createUniswapFetchClient({
  baseUrl,
  includeBaseUniswapHeaders = true,
  additionalHeaders = {},
}: {
  baseUrl: string
  includeBaseUniswapHeaders?: boolean
  additionalHeaders?: HeadersInit & {
    'x-uniquote-enabled'?: string
  }
}): FetchClient {
  const headers = includeBaseUniswapHeaders ? { ...BASE_UNISWAP_HEADERS, ...additionalHeaders } : additionalHeaders

  return createFetchClient({
    baseUrl,
    getHeaders: () => headers,
    getSessionService: () =>
      provideSessionService({ getBaseUrl: () => uniswapUrls.apiBaseUrlV2, getIsSessionServiceEnabled }),
  })
}
