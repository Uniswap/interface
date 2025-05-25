import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { expect, test } from 'playwright/fixtures'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'
import { parseEther } from 'viem'

test.describe('Wrap', () => {
  test('should wrap ETH', async ({ page }) => {
    await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${WETH_ADDRESS(UniverseChainId.Mainnet)}`)
    await page.getByTestId(TestID.AmountInputIn).fill('0.01')
    await page.getByTestId(TestID.ReviewSwap).click()
    await expect(page.getByText('Wrapped')).toBeVisible()
    await expect(page.getByText('0.010 ETH for 0.010 WETH')).toBeVisible()
  })

  test('should unwrap WETH', async ({ page, anvil }) => {
    await anvil.setErc20Balance(assume0xAddress(WETH_ADDRESS(UniverseChainId.Mainnet)), parseEther('1'))
    await page.goto(`/swap?inputCurrency=${WETH_ADDRESS(UniverseChainId.Mainnet)}&outputCurrency=ETH`)
    await page.getByTestId(TestID.AmountInputIn).fill('0.01')
    await page.getByTestId(TestID.ReviewSwap).click()
    await expect(page.getByText('Unwrapped')).toBeVisible()
    await expect(page.getByText('0.010 WETH for 0.010 ETH')).toBeVisible()
  })
})
