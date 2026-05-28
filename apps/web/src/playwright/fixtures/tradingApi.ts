import { Page } from 'playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'

/**
 * Generic helper function to stub trading API endpoints and disable transaction simulation
 */
export async function stubTradingApiEndpoint(page: Page, endpoint: string, modifyData?: (data: any) => any) {
  await page.route(`${uniswapUrls.tradingApiUrl}${endpoint}`, async (route) => {
    const request = route.request()
    const postData = request.postDataJSON()

    let modifiedData = {
      ...postData,
      // Disable transaction simulation because we can't actually simulate the transaction or it will fail
      // Because the TAPI uses the actual blockchain to simulate the transaction, whereas playwright is running an anvil fork
      simulateTransaction: false,
    }

    if (modifyData) {
      modifiedData = modifyData(modifiedData)
    }

    await route.continue({
      postData: JSON.stringify(modifiedData),
    })
  })
}
