import { config } from 'uniswap/src/config'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { REQUEST_SOURCE, getVersionHeader } from 'uniswap/src/data/constants'

export const FOR_API_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-KEY': config.uniswapApiKey,
  'x-request-source': REQUEST_SOURCE,
  'x-app-version': getVersionHeader(),
  Origin: uniswapUrls.requestOriginUrl,
}
