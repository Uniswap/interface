import { Page } from 'playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'

// eslint-disable-next-line multiline-comment-style
/**
 * Mocks the Unitag API response for a specific address
 * @param page The Playwright page
 * @param address The wallet address to mock unitag data for

 * @param unitag The unitag data to return (null for no unitag)
 */
export async function mockUnitagResponse(page: Page, address: string, unitag: string | null) {
  await page.route(`${uniswapUrls.unitagsApiUrl}/address?address=${address}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        username: unitag,
        address,
      }),
    })
  })
}
