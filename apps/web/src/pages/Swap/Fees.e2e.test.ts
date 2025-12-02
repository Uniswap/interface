import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe('Fees', () => {
  test('should not display fee on swaps without fees', async ({ page }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
    await page.goto(`/swap?inputCurrency=${DAI.address}&outputCurrency=${USDC_MAINNET.address}`)

    // Enter amount
    await page.getByTestId(TestID.AmountInputOut).fill('1')

    // Verify fee UI
    await page.getByTestId(TestID.GasInfoRow).click()
    // Verify there is no "fee" text:
    const locator = page.locator('Fee')
    await expect(locator).toHaveCount(0)
  })
})
