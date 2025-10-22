import { expect, getTest } from 'playwright/fixtures'
import { Mocks } from 'playwright/mocks/mocks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

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

    // Wait for wallet to be connected
    await page.getByTestId(TestID.Web3StatusConnected).waitFor()

    await page.getByTestId(TestID.ChooseInputToken).click()
    // eslint-disable-next-line
    await page.getByTestId('for-currency-list-wrapper').getByText('Ethereum').click()
  })

  test('quick amount select', async ({ page }) => {
    await page.getByText('$100', { exact: true }).click()
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByTestId(TestID.BuyFormChooseProvider)).toBeVisible()
  })

  test('user input amount', async ({ page }) => {
    await page.getByTestId(TestID.BuyFormAmountInput).click()
    await page.getByTestId(TestID.BuyFormAmountInput).fill('123')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByTestId(TestID.BuyFormChooseProvider)).toBeVisible()
  })

  test('change input token', async ({ page }) => {
    await page.getByTestId(TestID.ChooseInputToken).click()
    // eslint-disable-next-line
    await page.getByTestId('for-currency-list-wrapper').getByText('DAI').nth(1).click()
    await page.getByTestId(TestID.BuyFormAmountInput).fill('123')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByTestId(TestID.BuyFormChooseProvider)).toBeVisible()
  })

  test('change country', async ({ page }) => {
    await page.getByTestId(TestID.FiatOnRampCountryPicker).click()
    await page.getByText('Argentina').click()
    await page.getByTestId(TestID.BuyFormAmountInput).fill('123')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByTestId(TestID.BuyFormChooseProvider)).toBeVisible()
  })
})
