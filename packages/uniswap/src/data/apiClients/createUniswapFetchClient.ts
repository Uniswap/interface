import { createFetchClient, type FetchClient, provideSessionService } from '@universe/api'
import { tryProvideSession } from '@universe/api'
import { isMobileApp, isWebApp, REQUEST_SOURCE } from '@universe/environment'
import { getIsSessionServiceEnabled } from '@universe/gating'
import { SessionGateSource } from '@universe/sessions'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls, UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/getVersionHeader'

export const BASE_UNISWAP_HEADERS = {
  'x-request-source': REQUEST_SOURCE,
  ...(!isWebApp ? { 'x-app-version': getVersionHeader() } : {}),
  ...(isMobileApp ? { Origin: UniswapStaticUrls.apiOrigin } : {}),
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
  // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
  const headers = includeBaseUniswapHeaders ? { ...BASE_UNISWAP_HEADERS, ...additionalHeaders } : additionalHeaders

  return createFetchClient({
    baseUrl,
    getHeaders: () => headers,
    getSessionService: () =>
      provideSessionService({
        getBaseUrl: () => getUniswapServiceUrls(config).apiBaseUrlV2,
        getIsSessionServiceEnabled,
      }),
    getSession: tryProvideSession,
    source: SessionGateSource.FetchUniswap,
  })
}
