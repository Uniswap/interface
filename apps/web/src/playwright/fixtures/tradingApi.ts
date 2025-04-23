import { Page } from 'playwright/test'

/**
 * Prevents v4 pools from being used in the quote.
 * Use this if your test is sensitive to an extra "high price impact" step appearing in the swap flow.
 */
export async function stubTradingApiQuoteProtocols(page: Page) {
  await page.route('https://trading-api-labs.interface.gateway.uniswap.org/v1/quote', async (route) => {
    const request = route.request()
    const postData = request.postDataJSON()

    // Modify the request to set simulateTransaction to false
    // because we can't actually simulate the transaction or it will fail
    const modifiedData = {
      ...postData,
      protocols: ['V2', 'V3'],
    }

    await route.continue({
      postData: JSON.stringify(modifiedData),
    })
  })
}

export async function stubTradingApiSwap(page: Page) {
  await page.route('https://trading-api-labs.interface.gateway.uniswap.org/v1/swap', async (route) => {
    const request = route.request()
    const postData = request.postDataJSON()

    // Modify the request to set simulateTransaction to false
    // because we can't actually simulate the transaction or it will fail
    const modifiedData = {
      ...postData,
      simulateTransaction: false,
    }

    await route.continue({
      postData: JSON.stringify(modifiedData),
    })
  })
}

export async function stubTradingApiCreatePosition(page: Page) {
  await page.route('https://trading-api-labs.interface.gateway.uniswap.org/v1/lp/create', async (route) => {
    const request = route.request()
    const postData = request.postDataJSON()

    // Modify the request to set simulateTransaction to false
    // because we can't actually simulate the transaction or it will fail
    const modifiedData = {
      ...postData,
      simulateTransaction: false,
    }

    await route.continue({
      postData: JSON.stringify(modifiedData),
    })
  })
}
