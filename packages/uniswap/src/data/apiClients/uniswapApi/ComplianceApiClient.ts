import { createComplianceApiClient } from '@universe/api'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export const ComplianceApiClient = createComplianceApiClient({
  baseUrl: uniswapUrls.complianceApiBaseUrl,
})
