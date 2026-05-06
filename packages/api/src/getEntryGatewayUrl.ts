import {
  PROD_ENTRY_GATEWAY_API_BASE_URL,
  STAGING_ENTRY_GATEWAY_API_BASE_URL,
} from '@universe/api/src/clients/base/urls'
import { getConfig } from '@universe/config'
import { Environment, getCurrentEnv } from 'utilities/src/environment/getCurrentEnv'

export const ENTRY_GATEWAY_PROXY_PATH = '/entry-gateway'

/**
 * URL segment per environment used by the proxy. Kept as part of the public
 * contract so the BFF/dev proxies and the front-end produce matching paths
 * (see apps/web/functions/app.ts).
 */
export const ENTRY_GATEWAY_PROXY_ENV_SEGMENT: Record<Environment, string> = {
  [Environment.DEV]: 'dev',
  [Environment.STAGING]: 'staging',
  [Environment.PROD]: 'prod',
}

/**
 * Get the FOR API URL routed through the Entry Gateway.
 * Delegates to getEntryGatewayUrl() and appends the FOR service path.
 */
export function getMigratedForApiUrl(): string {
  return `${getEntryGatewayUrl()}/FOR.v1.FORService`
}

interface GetEntryGatewayUrlOptions {
  /**
   * Force the request onto a specific backend environment regardless of the
   * deployment. Use this when a service has a fixed env requirement (e.g.
   * unitags must always hit prod for stable name mapping). The caller declares
   * its requirement at the call site — this keeps the env decision explicit
   * instead of hiding it behind a feature alias.
   *
   * When the proxy is enabled, the env is encoded into the proxy path
   * (`/entry-gateway/prod`) so the BFF can route to the matching upstream.
   * When the proxy is disabled, the env directly selects the upstream URL.
   */
  env?: Environment
}

/**
 * Returns the appropriate Entry Gateway API base URL based on the current environment.
 * When proxy is enabled, returns the proxy path. Otherwise returns the direct URL.
 * Can be overridden by setting ENTRY_GATEWAY_API_URL_OVERRIDE in environment variables.
 */
export function getEntryGatewayUrl(options?: GetEntryGatewayUrlOptions): string {
  const config = getConfig()

  // Env-pinned calls bypass the override. The override is meant to redirect
  // *default* traffic to a chosen backend (e.g. corn-staging on a staging
  // deployment). A caller saying `{ env: PROD }` has stated a hard
  // requirement — silently rerouting it to the override would break services
  // like unitags that need a specific env regardless of deployment.
  if (!options?.env) {
    const override: string = config.entryGatewayApiUrlOverride
    if (override) {
      return override
    }
  }

  // Use proxy path if enabled (local dev, Vercel previews, or explicit opt-in).
  // An env-pinned call gets a per-env subpath so the BFF can forward to the
  // matching backend without the client having to know upstream URLs.
  if (config.enableEntryGatewayProxy) {
    if (options?.env) {
      return `${ENTRY_GATEWAY_PROXY_PATH}/${ENTRY_GATEWAY_PROXY_ENV_SEGMENT[options.env]}`
    }
    return ENTRY_GATEWAY_PROXY_PATH
  }

  const environment = options?.env ?? getCurrentEnv({ isVercelEnvironment: config.isVercelEnvironment })
  switch (environment) {
    case Environment.DEV: // Dev also currently uses staging builds, as for many features staging is more stable / less prone to breaking testing changes.
    case Environment.STAGING:
      return STAGING_ENTRY_GATEWAY_API_BASE_URL
    case Environment.PROD:
      return PROD_ENTRY_GATEWAY_API_BASE_URL
    default:
      throw new Error(`Invalid environment: ${environment}`)
  }
}
