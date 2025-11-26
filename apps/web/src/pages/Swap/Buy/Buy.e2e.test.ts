import { expect, getTest } from 'playwright/fixtures'
import { stubTradingApiEndpoint } from 'playwright/fixtures/tradingApi'
import { Mocks } from 'playwright/mocks/mocks'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Buy Crypto Form',
  {
    tag: '@team:apps-growth',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-growth' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      const mockRoutes = [
        { pattern: '**/GetCountry', file: Mocks.FiatOnRamp.get_country },
        { pattern: '**/SupportedFiatCurrencies', file: Mocks.FiatOnRamp.supported_fiat_currencies },
        { pattern: '**/SupportedCountries', file: Mocks.FiatOnRamp.supported_countries },
        { pattern: '**/SupportedTokens', file: Mocks.FiatOnRamp.supported_tokens },
        { pattern: '**/Quote', file: Mocks.FiatOnRamp.quotes },
      ]

      for (const { pattern, file } of mockRoutes) {
        await page.route(pattern, async (route) => {
          await route.fulfill({ path: file })
        })
      }

      await stubTradingApiEndpoint({ page, endpoint: uniswapUrls.tradingApiPaths.quote })
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
  },
)
