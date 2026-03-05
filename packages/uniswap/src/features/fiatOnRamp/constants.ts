import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/getVersionHeader'
import { isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

/**
 * Get FOR API headers.
 *
 * When ForSessionsEnabled is true, we omit the X-API-KEY header because
 * Entry Gateway prioritizes API key auth over session auth. Session auth
 * is required to get the session score (60) needed for FOR API access.
 *
 * This is a function (not a constant) to evaluate the feature flag at request time.
 */
export function getForApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // Only include API key when sessions are disabled (legacy auth flow)
    ...(!getFeatureFlag(FeatureFlags.ForSessionsEnabled) ? { 'X-API-KEY': config.uniswapApiKey } : {}),
    'x-request-source': REQUEST_SOURCE,
    ...(isMobileApp ? { 'x-app-version': getVersionHeader() } : {}),
    Origin: uniswapUrls.requestOriginUrl,
  }
}

/**
 * @deprecated Use getForApiHeaders() instead for dynamic feature flag evaluation.
 * This constant is kept for backward compatibility but always includes the API key.
 */
export const FOR_API_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  'X-API-KEY': config.uniswapApiKey,
  'x-request-source': REQUEST_SOURCE,
  ...(isMobileApp ? { 'x-app-version': getVersionHeader() } : {}),
  Origin: uniswapUrls.requestOriginUrl,
}

export const FOR_MODAL_SNAP_POINTS = ['70%', '100%']
export const SERVICE_PROVIDER_ICON_SIZE = 90
export const SERVICE_PROVIDER_ICON_BORDER_RADIUS = 20

export const ServiceProviderLogoStyles = {
  icon: {
    height: SERVICE_PROVIDER_ICON_SIZE,
    width: SERVICE_PROVIDER_ICON_SIZE,
    borderRadius: SERVICE_PROVIDER_ICON_BORDER_RADIUS,
  },
  uniswapLogoWrapper: {
    backgroundColor: '#FFEFF8', // #FFD8EF with 40% opacity on a white background
    borderRadius: SERVICE_PROVIDER_ICON_BORDER_RADIUS,
    height: SERVICE_PROVIDER_ICON_SIZE,
    width: SERVICE_PROVIDER_ICON_SIZE,
  },
}
