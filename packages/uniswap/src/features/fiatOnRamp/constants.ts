import { config } from 'nexttrade/src/config'
import { nexttradeUrls } from 'nexttrade/src/constants/urls'
import { REQUEST_SOURCE, getVersionHeader } from 'nexttrade/src/data/constants'
import { isMobileApp } from 'utilities/src/platform'

export const FOR_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': config.uniswapApiKey, // This might need to be nexttradeApiKey if the key name changes
  'x-request-source': REQUEST_SOURCE,
  ...(isMobileApp ? { 'x-app-version': getVersionHeader() } : {}),
  Origin: nexttradeUrls.requestOriginUrl,
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
  nexttradeLogoWrapper: {
    backgroundColor: '#FFEFF8', // #FFD8EF with 40% opacity on a white background
    borderRadius: SERVICE_PROVIDER_ICON_BORDER_RADIUS,
    height: SERVICE_PROVIDER_ICON_SIZE,
    width: SERVICE_PROVIDER_ICON_SIZE,
  },
}
