import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { Layers, PriceUxUpdateProperties } from 'uniswap/src/features/gating/experiments'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe('Fees', () => {
  test('should not display fee on swaps without fees', async ({ page }) => {
    await page.goto(`/swap?inputCurrency=${DAI.address}&outputCurrency=${USDC_MAINNET.address}`)

    // Enter amount
    await page.getByTestId(TestID.AmountInputOut).fill('1')

    // Verify fee UI
    await page.getByTestId(TestID.GasInfoRow).click()
    // Verify there is no "fee" text:
    const locator = page.locator('Fee')
    await expect(locator).toHaveCount(0)
  })

  test('displays UniswapX fee in UI', async ({ page }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })

    await page.goto(
      `/swap?inputCurrency=ETH&outputCurrency=${DAI.address}&layerOverride=${Layers.SwapPage}:${PriceUxUpdateProperties.UpdatedPriceUX}`,
    )

    await page.route(`${uniswapUrls.tradingApiUrl}/v1/quote`, async (route, request) => {
      const postData = await request.postData()
      const data = JSON.parse(postData ?? '{}')
      if (data.tokenOut === USDC_MAINNET.address) {
        await route.continue()
      } else {
        await route.fulfill({ path: Mocks.UniswapX.quote })
      }
    })

    // Set up swap
    await page.getByTestId(TestID.AmountInputOut).fill('1')
    // Verify fee UI
    await page.getByTestId(TestID.GasInfoRow).click()
    // Pseudo check to verify that the swap label is visible and the fee is $0:
    await expect(page.getByText('Swap network cost')).toBeVisible()
    await expect(page.getByText('Free')).toBeVisible()
  })
})
