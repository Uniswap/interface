import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Swap Settings',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('opens and closes the settings menu', async ({ page }) => {
      await page.goto('/swap')
      await page.getByTestId(TestID.SwapSettings).click()
      await expect(page.getByText('Max slippage')).toBeVisible()
      await expect(page.getByText('Default')).toBeVisible()
      await page.getByTestId(TestID.SwapSettings).click()
      await expect(page.getByText('Max slippage')).not.toBeVisible()
    })

    test('should open the mobile settings menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/swap')
      await page.getByTestId(TestID.SwapSettings).click()
      await expect(page.getByText('Max slippage')).toBeVisible()
      await expect(page.getByText('Default')).toBeVisible()
      await expect(page.getByTestId(TestID.MobileWebSettingsMenu).first()).toBeVisible()
    })
  },
)
