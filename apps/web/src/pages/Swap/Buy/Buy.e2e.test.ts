import { expect, test } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'

test.describe('Buy Crypto Form', () => {
  test.beforeEach(async ({ page }) => {
    const mockRoutes = [
      { pattern: '**/fiat-on-ramp/get-country', file: Mocks.FiatOnRamp.get_country },
      { pattern: '**/fiat-on-ramp/supported-fiat-currencies*', file: Mocks.FiatOnRamp.supported_fiat_currencies },
      { pattern: '**/fiat-on-ramp/supported-countries*', file: Mocks.FiatOnRamp.supported_countries },
      { pattern: '**/fiat-on-ramp/supported-tokens*', file: Mocks.FiatOnRamp.supported_tokens },
      { pattern: '**/fiat-on-ramp/quote*', file: Mocks.FiatOnRamp.quotes },
    ]

    for (const { pattern, file } of mockRoutes) {
      await page.route(pattern, async (route) => {
        await route.fulfill({ path: file })
      })
    }

    await page.goto('/buy')

    await page.act({ action: 'Open the "Select a token" modal' })
    await page.act({ action: 'Click token "ETH"' })
  })

  test('quick amount select', async ({ page }) => {
    await page.act({ action: 'Click preset amount "$100"' })
    await page.act({ action: 'Click Continue' })
    await expect(page.getByText('Checkout with')).toBeVisible()
  })

  test('user input amount', async ({ page }) => {
    await page.act({ action: 'Fill amount input with "123"' })
    await page.act({ action: 'Click Continue' })
    await expect(page.getByText('Checkout with')).toBeVisible()
  })

  test('change input token', async ({ page }) => {
    await page.act({ action: 'Click token "ETH"' })
    await page.act({ action: 'Click token "DAI"' })
    await page.act({ action: 'Fill amount input with "123"' })
    await page.act({ action: 'Click "Continue"' })
    await expect(page.getByText('Checkout with')).toBeVisible()
  })

  test('change country', async ({ page }) => {
    await page.getByTestId('FiatOnRampCountryPicker').click()
    await page.act({ action: 'Select country "Argentina"' })
    await page.act({ action: 'Fill amount input with "123"' })
    await page.act({ action: 'Click "Continue"' })
    await expect(page.getByText('Checkout with')).toBeVisible()
  })
})
