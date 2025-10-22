import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { AddressStringFormat, normalizeAddress } from 'uniswap/src/utils/addresses'
import { HexString } from 'utilities/src/addresses/hex'

const test = getTest({ withAnvil: true })

test.describe('Errors', () => {
  test('wallet rejection', async ({ page, anvil }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })

    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    await anvil.setTransactionRejection()

    // Enter amount to swap
    await page.getByTestId(TestID.AmountInputOut).fill('1')

    // Wait for input value to be populated
    await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

    // Submit transaction
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    // Verify rejection state by checking the button text
    await expect(page.getByTestId(TestID.Swap)).toContainText('Swap')
  })

  test.skip('transaction past deadline', async ({ page, anvil }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })
    await stubTradingApiEndpoint({
      page,
      endpoint: uniswapUrls.tradingApiPaths.quote,
      modifyRequestData: (data) => ({
        ...data,
        protocols: ['V2', 'V3'],
      }),
    })

    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    // Enter amount to swap
    await page.getByTestId(TestID.AmountInputOut).fill('1')

    // Wait for input value to be populated
    await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

    // Submit transaction
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    // Get the hash of the transaction in the mempool
    let hash: HexString | undefined
    const startTime = performance.now()
    const timeoutMs = 5000
    while (!hash) {
      if (performance.now() - startTime > timeoutMs) {
        throw new Error('Timeout: Transaction hash not found within 5 seconds')
      }

      const poolContent = await anvil.getTxpoolContent()
      const currentTransaction = Object.entries(
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        poolContent.pending[normalizeAddress(TEST_WALLET_ADDRESS, AddressStringFormat.Lowercase) as HexString] ?? {},
      )[0]

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      hash = currentTransaction[1]?.hash
    }

    await anvil.dropTransaction({
      hash: hash as HexString,
    })
    await anvil.mine({
      blocks: 1,
    })

    // Verify failure state by checking the button text
    await expect(page.getByText('Swap failed')).toBeVisible()
  })

  test('slippage failure', async ({ page, anvil }) => {
    await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.swap })

    const originalEthBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })

    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

    await page.getByTestId(TestID.SwapSettings).click()
    await page
      .locator('div')
      .filter({ hasText: /^5.50$/ })
      .getByRole('textbox')
      .fill('.01')

    await page.getByTestId(TestID.SwapSettings).click()

    await page.waitForTimeout(1000)

    await page.getByTestId(TestID.AmountInputIn).fill('1')
    await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(/.+/)
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    await page.waitForTimeout(1000)

    await page.getByTestId(TestID.AmountInputIn).fill('1')
    await expect(page.getByTestId(TestID.AmountInputOut)).toHaveValue(/.+/)
    await page.getByTestId(TestID.ReviewSwap).click()
    await page.getByTestId(TestID.Swap).click()

    // mine both transaction
    await anvil.mine({
      blocks: 1,
    })

    // Only one swap should succeed
    await expect(page.getByText('Swapped')).toBeVisible()
    const balance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })
    expect(balance > originalEthBalance - 200000000000000000000n)
  })
})
