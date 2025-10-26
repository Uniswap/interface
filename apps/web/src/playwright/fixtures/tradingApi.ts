// biome-ignore lint/style/noRestrictedImports: Trading API fixtures need direct Playwright imports
import { test as base } from '@playwright/test'
import { Page } from 'playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'

export const DEFAULT_TEST_GAS_LIMIT = '20000000'

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
      const { ignored } = shouldIgnorePageError(error)
      if (ignored) {
        return
      }

      throw error
    }
  })
}

type TradingApiFixture = {
  txPolling: void
}

export const test = base.extend<TradingApiFixture>({
  // Intercept tx polling requests to trading api and succeed
  // https://trading-api-labs.interface.gateway.uniswap.org/v1/swaps
  // {
  //     "requestId": "1b0bef68-a804-4532-b956-781bf9856229",
  //     "swaps": [
  //         {
  //             "status": "SUCCESS",
  //             "swapType": "CLASSIC",
  //             "txHash": "0x3feefd82ee859f26985bb90467361f49c42dde6f9c3c9199f5bc33849f74ecd0"
  //         }
  //     ]
  // }
  txPolling: [
    async ({ page }, use) => {
      try {
        await page.route(
          `${uniswapUrls.tradingApiUrl}${uniswapUrls.tradingApiPaths.swaps}?txHashes=*`,
          async (route) => {
            try {
              const response = await route.fetch()
              const responseText = await response.text()
              const responseJson = JSON.parse(responseText)
              if (responseJson.swaps?.[0]) {
                responseJson.swaps[0].status = 'SUCCESS'
              }

              return route.fulfill({
                body: JSON.stringify(responseJson),
              })
            } catch (error) {
              const { ignored } = shouldIgnorePageError(error)
              if (ignored) {
                return undefined
              }

              throw error
            }
          },
        )

        await use(undefined)
      } catch (e) {
        console.warn('[txPolling fixture] Failed to set up route interception:', e)
        await use(undefined)
      }
    },
    { auto: true },
  ],
})
