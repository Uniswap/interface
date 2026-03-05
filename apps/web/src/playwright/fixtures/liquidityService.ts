import type { MethodInfo, ServiceType } from '@bufbuild/protobuf'
// biome-ignore lint/style/noRestrictedImports: Liquidity Service fixtures need direct Playwright imports
import { type Page } from '@playwright/test'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { uniswapUrls } from 'uniswap/src/constants/urls'

/**
 * Helper to construct the Connect/gRPC-web endpoint path from a service method
 * @example
 * const endpoint = getServiceMethodPath(LiquidityService, LiquidityService.methods.migrateV3ToV4LPPosition)
 * // Returns: "uniswap.liquidity.v1.LiquidityService/MigrateV3ToV4LPPosition"
 */
function getServiceMethodPath(service: ServiceType, method: MethodInfo): string {
  return `${service.typeName}/${method.name}`
}

const shouldIgnorePageError = (error: Error): { ignored: boolean } => {
  if (
    error.message.includes('Target page, context or browser has been closed') ||
    error.message.includes('Test ended')
  ) {
    console.log(`🟡 Ignored route error after page close: ${error.message}`)
    return { ignored: true }
  }

  return { ignored: false }
}

/**
 * Generic helper function to stub liquidity service endpoints and disable transaction simulation
 *
 * Note: Connect/gRPC-web can use either binary protobuf or JSON encoding.
 * We force JSON mode by setting appropriate headers so we can modify the response in tests.
 *
 * @example Using method definition (type-safe):
 * ```ts
 * await stubLiquidityServiceEndpoint({
 *   page,
 *   endpoint: LiquidityService.methods.migrateV3ToV4LPPosition,
 * })
 * ```
 */
export async function stubLiquidityServiceEndpoint({
  page,
  endpoint,
  modifyRequestData,
  modifyResponseData,
}: {
  page: Page
  endpoint: MethodInfo
  modifyRequestData?: (data: any) => any
  modifyResponseData?: (data: any) => any
}) {
  const endpointPath = getServiceMethodPath(LiquidityService, endpoint)

  // Liquidity service uses Connect/gRPC-web protocol with specific path structure
  // The endpoint will be something like: uniswap.liquidity.v1.LiquidityService/MigrateV3ToV4LPPosition
  await page.route(`${uniswapUrls.liquidityServiceUrl}/${endpointPath}*`, async (route) => {
    try {
      const request = route.request()

      // Force Connect to use JSON format instead of binary protobuf
      // This allows us to parse and modify the request/response
      const headers = {
        ...request.headers(),
        'content-type': 'application/json',
      }

      const postData = JSON.parse(request.postData() ?? '{}')

      let modifiedData = {
        ...postData,
        // Disable transaction simulation because we can't actually simulate the transaction or it will fail
        // Because the liquidity service uses the actual blockchain to simulate the transaction, whereas playwright is running an anvil fork
        simulateTransaction: false,
      }

      if (modifyRequestData) {
        modifiedData = modifyRequestData(modifiedData)
      }

      // Fetch with modified request, forcing JSON response
      const response = await route.fetch({
        method: request.method(),
        headers,
        postData: JSON.stringify(modifiedData),
      })

      let responseJson = JSON.parse(await response.text())

      if (modifyResponseData) {
        responseJson = modifyResponseData(responseJson)
      }

      await route.fulfill({
        status: response.status(),
        headers: {
          ...response.headers(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(responseJson),
      })
    } catch (error) {
      const { ignored } = shouldIgnorePageError(error)
      if (ignored) {
        return
      }

      throw error
    }
  })
}
