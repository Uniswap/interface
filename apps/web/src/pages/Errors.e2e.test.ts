import { expect, test } from 'playwright/fixtures'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/anvil'
import { stubTradingApiQuoteProtocols, stubTradingApiSwap } from 'playwright/fixtures/tradingApi'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

test('wallet rejection', async ({ page, anvil }) => {
  await stubTradingApiSwap(page)

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
  await stubTradingApiSwap(page)
  await stubTradingApiQuoteProtocols(page)

  await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

  // Enter amount to swap
  await page.getByTestId(TestID.AmountInputOut).fill('1')

  // Wait for input value to be populated
  await expect(page.getByTestId(TestID.AmountInputIn)).toHaveValue(/.+/)

  // Submit transaction
  await page.getByTestId(TestID.ReviewSwap).click()
  await page.getByTestId(TestID.Swap).click()

  // Get the hash of the transaction in the mempool
  let hash: `0x${string}` | undefined
  const startTime = performance.now()
  const timeoutMs = 5000
  while (!hash) {
    if (performance.now() - startTime > timeoutMs) {
      throw new Error('Timeout: Transaction hash not found within 5 seconds')
    }

    const poolContent = await anvil.getTxpoolContent()
    const currentTransaction = Object.entries(
      poolContent.pending[TEST_WALLET_ADDRESS.toLowerCase() as `0x${string}`] ?? {},
    )?.[0]

    hash = currentTransaction?.[1]?.hash
  }

  await anvil.dropTransaction({
    hash: hash as `0x${string}`,
  })
  await anvil.mine({
    blocks: 1,
  })

  // Verify failure state by checking the button text
  await expect(page.getByText('Swap failed')).toBeVisible()
})

test('slippage failure', async ({ page, anvil }) => {
  await stubTradingApiSwap(page)

  const originalEthBalance = await anvil.getBalance({ address: TEST_WALLET_ADDRESS })

  await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

  await page.getByTestId(TestID.SwapSettings).click()
  await page
    .locator('div')
    .filter({ hasText: /^5.50$/ })
    .getByRole('textbox')
    .fill('.01')
  await page.waitForTimeout(300)
  await page.getByTestId(TestID.SwapSettings).click()

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

test('insufficient liquidity', async ({ page }) => {
  await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_MAINNET.address}`)

  // The API response is too variable so stubbing a 404.
  await page.route('https://trading-api-labs.interface.gateway.uniswap.org/v1/quote', async (route) => {
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
