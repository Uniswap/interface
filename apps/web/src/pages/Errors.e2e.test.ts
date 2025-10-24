import { expect, getTest } from 'playwright/fixtures'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe('Errors', () => {
  test('insufficient liquidity', async ({ page }) => {
    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    // The API response is too variable so stubbing a 404.
    await page.route(`${uniswapUrls.tradingApiUrl}/v1/quote`, async (route) => {
      await route.fulfill({
        status: 404,
        body: JSON.stringify({
          errorCode: 'QUOTE_ERROR',
          detail: 'No quotes available',
          id: '63363cc1-d474-4584-b386-7c356814b79f',
        }),
      })
    })

    await page.getByTestId(TestID.AmountInputOut).fill('10000')
    await expect(page.getByText('This trade cannot be completed right now')).toBeVisible()
  })
})
