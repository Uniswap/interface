import { createComplianceApiClient } from '@universe/api'
import { config } from 'uniswap/src/config'
import { getUniswapServiceUrls } from 'uniswap/src/constants/urls'

export const ComplianceApiClient = createComplianceApiClient({
  baseUrl: getUniswapServiceUrls(config).complianceApiBaseUrl,
})
