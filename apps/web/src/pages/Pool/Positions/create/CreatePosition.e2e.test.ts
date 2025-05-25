import { ONE_MILLION_USDT } from 'playwright/anvil/utils'
import { expect, test } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { USDT } from 'uniswap/src/constants/tokens'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { assume0xAddress } from 'utils/wagmi'

test.describe('Create position', () => {
  test('Create position with full range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint(page, uniswapUrls.tradingApiPaths.createLp)
    await graphql.intercept('SearchTokens', 'search_token_tether.json')
    await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByTestId(TestID.AmountInputIn).first().click()
    await page.getByTestId(TestID.AmountInputIn).first().fill('1')
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText('Created position')).toBeVisible()
    await expect(page).toHaveURL('/positions')
  })

  test('Create position with custom range', async ({ page, anvil, graphql }) => {
    await stubTradingApiEndpoint(page, uniswapUrls.tradingApiPaths.createLp)
    await graphql.intercept('SearchTokens', 'search_token_tether.json')
    await anvil.setErc20Balance(assume0xAddress(USDT.address), ONE_MILLION_USDT)
    await page.goto('/positions/create')
    await page.getByRole('button', { name: 'Choose token' }).click()
    await page.getByTestId(TestID.ExploreSearchInput).fill(USDT.address)
    // eslint-disable-next-line
    await page.getByTestId('token-option-1-USDT').first().click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await page.getByText('Custom range').click()
    await page.getByTestId(TestID.AmountInputIn).first().click()
    await page.getByTestId(TestID.AmountInputIn).first().fill('1')
    await page.getByTestId(TestID.RangeInputDecrement + '-0').click()
    await page.getByTestId(TestID.RangeInputIncrement + '-1').click()
    await page.getByRole('button', { name: 'Review' }).click()
    await page.getByRole('button', { name: 'Create' }).click()
    await expect(page.getByText('Created position')).toBeVisible()
    await expect(page).toHaveURL('/positions')
  })
})
