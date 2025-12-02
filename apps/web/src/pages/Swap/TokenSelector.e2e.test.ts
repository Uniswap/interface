import { expect, getTest } from 'playwright/fixtures'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe('TokenSelector', () => {
  test('output - should show bridging and top tokens sections if empty', async ({ page }) => {
    await page.goto('/swap')
    await page.getByTestId(TestID.ChooseOutputToken).click()

    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
    ).toBeVisible()
    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
    ).toBeVisible()
  })

  test('output - should show top tokens sections if token selected', async ({ page }) => {
    await page.goto('/swap')
    await page.getByTestId(TestID.SwitchCurrenciesButton).click()
    await page.getByTestId(TestID.ChooseOutputToken).click()

    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
    ).toBeVisible()
    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
    ).not.toBeVisible()
  })

  test('input - should show top tokens sections if token selected', async ({ page }) => {
    await page.goto('/swap')
    await page.getByTestId(TestID.ChooseInputToken).click()

    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
    ).toBeVisible()
    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
    ).not.toBeVisible()
  })

  test('input - should show bridging and top tokens sections if empty', async ({ page }) => {
    await page.goto('/swap')
    await page.getByTestId(TestID.SwitchCurrenciesButton).click()
    await page.getByTestId(TestID.ChooseInputToken).click()

    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
    ).toBeVisible()
    await expect(
      page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
    ).toBeVisible()
  })
})
