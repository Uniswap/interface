import { Page } from 'playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export const DEFAULT_TEST_GAS_LIMIT = '20000000'

/**
 * Generic helper function to stub trading API endpoints and disable transaction simulation
 */
// eslint-disable-next-line max-params
export async function stubTradingApiEndpoint({
  page,
  endpoint,
  modifyRequestData,
  modifyResponseData,
}: {
  page: Page
  endpoint: string
  modifyRequestData?: (data: any) => any
  modifyResponseData?: (data: any) => any
}) {
  await page.route(`${uniswapUrls.tradingApiUrl}${endpoint}`, async (route) => {
    try {
      const request = route.request()
      const postData = request.postDataJSON()

      let modifiedData = {
        ...postData,
        // Disable transaction simulation because we can't actually simulate the transaction or it will fail
        // Because the TAPI uses the actual blockchain to simulate the transaction, whereas playwright is running an anvil fork
        simulateTransaction: false,
      }

      if (modifyRequestData) {
        modifiedData = modifyRequestData(modifiedData)
      }

      // Create a new request with modified data
      const response = await route.fetch({
        postData: JSON.stringify(modifiedData),
      })

      const responseText = await response.text()
      let responseJson = JSON.parse(responseText)
      // Set a high gas limit to avoid OutOfGas
      if (endpoint === uniswapUrls.tradingApiPaths.swap) {
        responseJson.swap.gasLimit = DEFAULT_TEST_GAS_LIMIT
      }

      if (modifyResponseData) {
        responseJson = modifyResponseData(responseJson)
      }

      await route.fulfill({
        body: JSON.stringify(responseJson),
      })
    } catch (error) {
      if (error.message?.includes('Target page, context or browser has been closed')) {
        // eslint-disable-next-line no-console
        console.log(`🟡 Ignored route error after page close: ${error.message}`)
        return
      }

      // Re-throw unexpected errors
      throw error
    }
  })
}
