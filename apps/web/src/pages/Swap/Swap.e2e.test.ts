import { expect, test } from 'playwright/fixtures'
import { TEST_WALLET_ADDRESS } from 'playwright/fixtures/anvil'
import { stubTradingApiSwap } from 'playwright/fixtures/tradingApi'
import { gotoAndWait } from 'playwright/utils'
import { USDT } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'
import { parseEther } from 'viem'

test('should load balances', async ({ page, anvil }) => {
  await page.goto('/swap')
  const ethBalance = await anvil.getBalance({
    address: TEST_WALLET_ADDRESS,
  })
  await expect(ethBalance).toBe(parseEther('10000'))
  await expect(page.getByText('10,000.00 ETH')).toBeVisible()
})

test('should load erc20 balances', async ({ page, anvil }) => {
  await anvil.setErc20Balance(assume0xAddress(USDT.address), 100_000_000n)
  await page.goto(`/swap?outputCurrency=${USDT.address}`)

  const USDTBalance = await anvil.getErc20Balance(assume0xAddress(USDT.address))

  await expect(USDTBalance).toBe(100_000_000n)
  await expect(page.getByText('100.00 USDT')).toBeVisible()
})

test('should swap ETH to USDC', async ({ page, anvil }) => {
  await stubTradingApiSwap(page)

  await page.goto('/swap')
  await page.getByTestId(TestID.ChooseOutputToken).click()
  // eslint-disable-next-line
  await page.getByTestId('token-option-1-USDC').first().click()
  await page.getByTestId(TestID.AmountInputIn).click()
  await page.getByTestId(TestID.AmountInputIn).fill('.1')
  await page.getByTestId(TestID.ReviewSwap).click()
  await page.getByTestId(TestID.Swap).click()

  const ethBalance = await anvil.getBalance({
    address: TEST_WALLET_ADDRESS,
  })

  await expect(ethBalance).toBeLessThan(parseEther('9999.9'))
  await expect(page.getByText('9,999.90 ETH')).toBeVisible()
})

test('should load swap settings with correct deadline title', async ({ page }) => {
  await gotoAndWait(page, '/swap')
  await expect(page.getByTestId(TestID.SwapSettings)).toBeVisible()
  await page.getByTestId(TestID.SwapSettings).click()
  await page.waitForTimeout(800)
  await expect(page.getByText('Swap deadline')).toBeVisible()
})

test('should be able to swap token with FOT warning via TDP', async ({ page, anvil }) => {
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

  await page.goto('/explore/tokens/ethereum/0x32b053f2cba79f80ada5078cb6b305da92bde6e1')
  await page.getByTestId(TestID.AmountInputIn).click()
  await page.getByTestId(TestID.AmountInputIn).fill('10')
  await page.getByTestId(TestID.ReviewSwap).click()

  // See token warning modal & confirm warning
  await expect(page.getByText('Fee detected')).toHaveCount(2)
  await page.getByTestId(TestID.Confirm).click()

  // See swap review screen & confirm swap
  await page
    .locator('div')
    .filter({ hasText: /^Swap$/ })
    .first()
    .click()

  // Confirm price impact warning
  await page.getByTestId(TestID.Confirm).click()

  await anvil.mine({
    blocks: 1,
  })

  const ethBalance = await anvil.getBalance({
    address: TEST_WALLET_ADDRESS,
  })

  await expect(ethBalance).toBeLessThan(parseEther('10000'))
})
