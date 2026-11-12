import { Environment } from '@universe/config'
import {
  isAndroid,
  isDevPortalApp,
  isExtensionApp,
  isMobileApp,
  isWebApp,
  isE2eTestEnv,
  isTestEnv,
} from '@universe/environment'
import {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  DEV_ENTRY_GATEWAY_HOST,
  DEV_RPC_API_BASE_URL,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_HOST,
  PROD_RPC_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_HOST,
  STAGING_RPC_API_BASE_URL,
} from './entryGatewayUrls'

export enum TrafficFlows {
  Scantastic = 'scantastic',
}

export const helpUrl = 'https://support.uniswap.org/hc/en-us'

export function getCloudflarePrefix(): string {
  if (isMobileApp) {
    return `${isAndroid ? 'android' : 'ios'}.wallet`
  }

  if (isExtensionApp) {
    return 'extension'
  }

  if (isE2eTestEnv() || isWebApp || isDevPortalApp) {
    return 'interface'
  }

  if (isTestEnv()) {
    return 'wallet'
  }

  throw new Error('Could not determine app to generate Cloudflare prefix')
}

export function getServicePrefix(flow?: TrafficFlows): string {
  return flow ? `${flow}.` : ''
}

export function getCloudflareApiBaseUrl(params?: { flow?: TrafficFlows; postfix?: string }): string {
  const { flow, postfix } = params ?? {}
  const baseUrl = `https://${getServicePrefix(flow)}${getCloudflarePrefix()}.gateway.uniswap.org`
  return postfix ? `${baseUrl}/${postfix}` : baseUrl
}

export function createHelpArticleUrl(resourceId: string, options?: { path?: string; section?: string }): string {
  const { path = 'articles', section } = options ?? {}
  const product = isMobileApp ? 'mobileApp' : isExtensionApp ? 'extension' : 'web'
  // The fragment must come after the query string so the browser resolves it to a section anchor.
  const fragment = section ? `#${section}` : ''
  return `${helpUrl}/${path}/${resourceId}?product_link=${product}${fragment}`
}

// Entry Gateway API URLs — canonical definitions live in ./entryGatewayUrls (zero-dep module)
export {
  DEV_ENTRY_GATEWAY_API_BASE_URL,
  DEV_ENTRY_GATEWAY_HOST,
  DEV_RPC_API_BASE_URL,
  DEV_RPC_HOST,
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  PROD_ENTRY_GATEWAY_HOST,
  PROD_RPC_API_BASE_URL,
  PROD_RPC_HOST,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_HOST,
  STAGING_RPC_API_BASE_URL,
  STAGING_RPC_HOST,
} from './entryGatewayUrls'

/** Entry Gateway base URL (with scheme) per backend environment. */
export const ENTRY_GATEWAY_API_BASE_URLS: Record<Environment, string> = {
  [Environment.Development]: DEV_ENTRY_GATEWAY_API_BASE_URL,
  [Environment.Staging]: STAGING_ENTRY_GATEWAY_API_BASE_URL,
  [Environment.Production]: PROD_ENTRY_GATEWAY_API_BASE_URL,
}

/** Entry Gateway hostname (no scheme) per backend environment. */
export const ENTRY_GATEWAY_HOSTS: Record<Environment, string> = {
  [Environment.Development]: DEV_ENTRY_GATEWAY_HOST,
  [Environment.Staging]: STAGING_ENTRY_GATEWAY_HOST,
  [Environment.Production]: PROD_ENTRY_GATEWAY_HOST,
}

/** Entry Gateway public front-door base URL (with scheme) per backend environment. */
export const RPC_API_BASE_URLS: Record<Environment, string> = {
  [Environment.Development]: DEV_RPC_API_BASE_URL,
  [Environment.Staging]: STAGING_RPC_API_BASE_URL,
  [Environment.Production]: PROD_RPC_API_BASE_URL,
}
