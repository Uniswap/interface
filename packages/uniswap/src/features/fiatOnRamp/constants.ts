import { isMobileApp, REQUEST_SOURCE } from '@universe/environment'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/getVersionHeader'

/**
 * Get FOR API headers.
 *
 * FOR is served through the Entry Gateway with session auth, so we never send an
 * X-API-KEY: the gateway prioritizes API key auth over session auth, and session
 * auth is required to get the session score (60) needed for FOR API access.
 *
 * This is a function (not a constant) so the app-version header is resolved at request time.
 */
export function getForApiHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'x-request-source': REQUEST_SOURCE,
    ...(isMobileApp ? { 'x-app-version': getVersionHeader() } : {}),
    Origin: UniswapStaticUrls.requestOriginUrl,
  }
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
