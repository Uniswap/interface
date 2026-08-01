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
  getHeaders,
  onResponse,
}: {
  baseUrl: string
  includeBaseUniswapHeaders?: boolean
  additionalHeaders?: HeadersInit & {
    'x-uniquote-enabled'?: string
  }
  /** Per-request dynamic headers, merged over the static ones (the dynamic value wins). */
  getHeaders?: () => HeadersInit
  /** Invoked with the raw Response of every completed request (headers only). */
  onResponse?: (response: Response) => void
}): FetchClient {
  // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
  const headers = includeBaseUniswapHeaders ? { ...BASE_UNISWAP_HEADERS, ...additionalHeaders } : additionalHeaders

  return createFetchClient({
    baseUrl,
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    getHeaders: () => ({ ...headers, ...getHeaders?.() }),
    onResponse,
    getSessionService: () =>
      provideSessionService({
        getBaseUrl: () => getUniswapServiceUrls(config).apiBaseUrlV2,
        getIsSessionServiceEnabled,
      }),
    getSession: tryProvideSession,
    source: SessionGateSource.FetchUniswap,
  })
}
