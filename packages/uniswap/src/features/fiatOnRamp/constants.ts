import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { getVersionHeader } from 'uniswap/src/data/constants'
import { isMobileApp } from 'utilities/src/platform'
import { REQUEST_SOURCE } from 'utilities/src/platform/requestSource'

export const FOR_API_HEADERS = {
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
