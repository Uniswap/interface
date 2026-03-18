import { FeatureFlags } from '@universe/gating'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'

const test = getTest()

const buildSwapUrl = createTestUrlBuilder({
  basePath: '/swap',
})

const buildLimitUrl = createTestUrlBuilder({
  basePath: '/limit',
})

test.describe(
  'TokenSelector',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('output - should show bridging and top tokens sections if empty', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
      ).toBeVisible()
    })

    test('output - should show top tokens sections if token selected', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
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
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.ChooseInputToken).click()

      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
      ).not.toBeVisible()
    })

    test('input - should show bridging and top tokens sections if empty', async ({ page }) => {
      await page.goto(buildSwapUrl({}))
      await page.getByTestId(TestID.SwitchCurrenciesButton).click()
      await page.getByTestId(TestID.ChooseInputToken).click()

      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.BridgingTokens}`),
      ).toBeVisible()
    })

    test('output - should show crosschain swaps promo banner when chained actions flag is enabled', async ({
      page,
    }) => {
      await page.goto(buildSwapUrl({ featureFlags: { [FeatureFlags.ChainedActions]: true } }))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      await expect(page.getByText('Crosschain swaps are here')).toBeVisible()
    })

    test('limit - should NOT show crosschain swaps promo banner in limit order flow', async ({ page }) => {
      await page.goto(buildLimitUrl({ featureFlags: { [FeatureFlags.ChainedActions]: true } }))
      // Limit page uses SwapCurrencyInputPanel which has a different selector
      await page.locator('.open-currency-select-button').last().click()

      // Verify token selector is open
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      await expect(page.getByText('Crosschain swaps are here')).not.toBeVisible()
    })

    test('output - should NOT show crosschain swaps promo banner when filtering to unsupported chain', async ({
      page,
    }) => {
      await page.goto(buildSwapUrl({ featureFlags: { [FeatureFlags.ChainedActions]: true } }))
      await page.getByTestId(TestID.ChooseOutputToken).click()

      // Verify token selector is open and banner is initially visible
      await expect(
        page.getByTestId(`${TestID.SectionHeaderPrefix}${OnchainItemSectionName.TrendingTokens}`),
      ).toBeVisible()
      await expect(page.getByText('Crosschain swaps are here')).toBeVisible()

      // Click on chain selector dropdown
      await page.getByTestId('chain-selector').click()

      // Select Polygon (chain ID 137) which doesn't support chained actions
      await page.getByTestId('network-button-137').click()

      // Verify the banner is no longer visible after filtering to unsupported chain
      await expect(page.getByText('Crosschain swaps are here')).not.toBeVisible()
    })
  },
)
