import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { expect, test } from 'playwright/fixtures'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

test.describe('Wrap', () => {
  test('should wrap ETH', async ({ page }) => {
    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${WETH_ADDRESS(UniverseChainId.Mainnet)}`)
    await page.getByTestId(TestID.AmountInputIn).fill('0.01')
    await page.getByTestId(TestID.ReviewSwap).click()
    await expect(page.getByText('Wrapped')).toBeVisible()
  })

  test('should unwrap WETH', async ({ page }) => {
    await page.goto(`/swap?inputCurrency=${WETH_ADDRESS(UniverseChainId.Mainnet)}&outputCurrency=ETH`)
    await page.getByTestId(TestID.AmountInputIn).fill('0.01')
    await page.getByTestId(TestID.ReviewSwap).click()
    await expect(page.getByText('Unwrapped')).toBeVisible()
  })
})
