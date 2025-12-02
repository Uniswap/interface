import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

const test = getTest({ withAnvil: true })

test.describe('Fees', () => {
  test('swaps ETH for USDC exact-in with swap fee', async ({ page, anvil }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })

    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    // Set up swap
    await page.getByTestId(TestID.AmountInputOut).fill('1')

    const response = await page.waitForResponse(`${uniswapUrls.tradingApiUrl}/v1/quote`)
    const {
      quote: { portionBips, portionRecipient },
    } = await response.json()

    const portionRecipientBalance = await anvil.getErc20Balance(assume0xAddress(USDC_MAINNET.address), portionRecipient)

    // Initiate transaction
    await page.getByTestId(TestID.ReviewSwap).click()

    // Verify fee percentage and amount is displayed
    await page.getByText(`Fee (${portionBips / 100}%)`)
    await page.getByTestId(TestID.Swap).click()

    // Verify fee recipient received fee
    const finalRecipientBalance = await anvil.getErc20Balance(assume0xAddress(USDC_MAINNET.address), portionRecipient)
    await expect(finalRecipientBalance).toBeGreaterThan(portionRecipientBalance)
  })
})
