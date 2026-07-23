import {
  isAndroid,
  isExtensionApp,
  isMobileApp,
  isWebApp,
  isBetaEnv,
  isDevEnv,
  isE2eTestEnv,
  isTestEnv,
} from '@universe/environment'

export enum TrafficFlows {
  GraphQL = 'graphql',
  Metrics = 'metrics',
  Gating = 'gating',
  Unitags = 'unitags',
  FOR = 'for',
  Scantastic = 'scantastic',
  DataApi = 'data-api',
}

export const helpUrl = 'https://support.uniswap.org/hc/en-us'

const FLOWS_USING_BETA = [TrafficFlows.FOR]

const isDevOrBeta = isE2eTestEnv() ? false : isDevEnv() || isBetaEnv()

export function getCloudflarePrefix(flow?: TrafficFlows): string {
  if (flow && isDevOrBeta && FLOWS_USING_BETA.includes(flow)) {
    return `beta`
  }

  if (isMobileApp) {
    return `${isAndroid ? 'android' : 'ios'}.wallet`
  }

  if (isExtensionApp) {
    return 'extension'
  }

  if (isE2eTestEnv() || isWebApp) {
    return 'interface'
  }

  if (isTestEnv()) {
    return 'wallet'
  }

  throw new Error('Could not determine app to generate Cloudflare prefix')
}

export function getServicePrefix(flow?: TrafficFlows): string {
  if (flow && (isE2eTestEnv() || !(isDevOrBeta && FLOWS_USING_BETA.includes(flow)))) {
    return flow + '.'
  } else {
    return ''
  }
}

export function getCloudflareApiBaseUrl(params?: { flow?: TrafficFlows; postfix?: string }): string {
  const { flow, postfix } = params ?? {}
  let baseUrl
  // DataApi: use staging entry gateway in dev to avoid CORS issues with beta.gateway.
  // Entry gateway doesn't use the /v2 path prefix, so postfix is intentionally ignored here.
  if (flow === TrafficFlows.DataApi && isDevEnv() && !isE2eTestEnv()) {
    return STAGING_ENTRY_GATEWAY_API_BASE_URL
  } else if (flow === TrafficFlows.DataApi) {
    baseUrl = `https://${getCloudflarePrefix(flow)}.gateway.uniswap.org`
  } else {
    baseUrl = `https://${getServicePrefix(flow)}${getCloudflarePrefix(flow)}.gateway.uniswap.org`
  }
  if (postfix) {
    baseUrl += `/${postfix}`
  }
  return baseUrl
}

export function createHelpArticleUrl(resourceId: string, options?: { path?: string; section?: string }): string {
  const { path = 'articles', section } = options ?? {}
  const product = isMobileApp ? 'mobileApp' : isExtensionApp ? 'extension' : 'web'
  // The fragment must come after the query string so the browser resolves it to a section anchor.
  const fragment = section ? `#${section}` : ''
  return `${helpUrl}/${path}/${resourceId}?product_link=${product}${fragment}`
}

// Entry Gateway API URLs
export const DEV_ENTRY_GATEWAY_API_BASE_URL: string = 'https://entry-gateway.backend-dev.api.uniswap.org'
export const STAGING_ENTRY_GATEWAY_API_BASE_URL: string = 'https://entry-gateway.backend-staging.api.uniswap.org'
export const PROD_ENTRY_GATEWAY_API_BASE_URL: string = 'https://entry-gateway.backend-prod.api.uniswap.org'

// WebSocket URLs
export const DEV_WEBSOCKET_BASE_URL: string = 'wss://websockets.backend-staging.api.uniswap.org'
export const STAGING_WEBSOCKET_BASE_URL: string = 'wss://websockets.backend-staging.api.uniswap.org'
// Same host as the session cookie so browsers attach it to the WS handshake; the gateway authenticates and proxies to the websockets service.
export const PROD_WEBSOCKET_BASE_URL: string = 'wss://entry-gateway.backend-prod.api.uniswap.org/ws'
