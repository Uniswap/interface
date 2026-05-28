import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'

const test = getTest()

const EW_ENABLED = `featureFlagOverride=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`
const NOT_CONNECTED = 'eagerlyConnect=false'

// Unitags moved from REST `/username?username=` to ConnectRPC. Mock the gRPC endpoint
// so unitag availability resolves to `available: true` without hitting the real backend.
const GET_USERNAME_URL = '**/uniswap.unitag.v1.UnitagService/GetUsername'
const AVAILABLE_USERNAME_RESPONSE = JSON.stringify({ available: true, requiresEnsMatch: false })

test.describe(
  'EW Registration Flow',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('Modal opens to ChooseUnitag step when EW enabled', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()
      await getVisibleDropdownElementByTestId(page, TestID.CreateAccount).click()

      await expect(page.getByTestId(TestID.DownloadUniswapModal)).toBeVisible()
      await expect(page.getByText('Choose a username')).toBeVisible()
    })

    test('KeyManagement page appears after unitag is chosen', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()
      await getVisibleDropdownElementByTestId(page, TestID.CreateAccount).click()

      // Stub the unitag availability endpoint
      await page.route(GET_USERNAME_URL, (route) =>
        route.fulfill({ contentType: 'application/json', body: AVAILABLE_USERNAME_RESPONSE }),
      )

      await page.getByTestId(TestID.WalletNameInput).fill('testuser')
      await page.getByTestId(TestID.Continue).click()

      await expect(page.getByText('Your wallet. Your crypto.')).toBeVisible()
    })

    test('PasskeyGeneration page appears after KeyManagement continue', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()
      await getVisibleDropdownElementByTestId(page, TestID.CreateAccount).click()

      await page.route(GET_USERNAME_URL, (route) =>
        route.fulfill({ contentType: 'application/json', body: AVAILABLE_USERNAME_RESPONSE }),
      )

      // Navigate through ChooseUnitag → KeyManagement
      await page.getByTestId(TestID.WalletNameInput).fill('testuser')
      await page.getByTestId(TestID.Continue).click()
      await expect(page.getByText('Your wallet. Your crypto.')).toBeVisible()

      // Continue to PasskeyGeneration
      await page.getByTestId(TestID.Continue).click()

      await expect(page.getByText('Secure your account')).toBeVisible()
      await expect(page.getByTestId(TestID.CreatePasskey)).toBeVisible()
    })

    test('Back navigation: PasskeyGeneration → KeyManagement → ChooseUnitag', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()
      await getVisibleDropdownElementByTestId(page, TestID.CreateAccount).click()

      await page.route(GET_USERNAME_URL, (route) =>
        route.fulfill({ contentType: 'application/json', body: AVAILABLE_USERNAME_RESPONSE }),
      )

      // Navigate to PasskeyGeneration
      await page.getByTestId(TestID.WalletNameInput).fill('testuser')
      await page.getByTestId(TestID.Continue).click()
      await expect(page.getByText('Your wallet. Your crypto.')).toBeVisible()
      await page.getByTestId(TestID.Continue).click()
      await expect(page.getByText('Secure your account')).toBeVisible()

      // Back to KeyManagement
      await page.getByTestId(TestID.Back).click()
      await expect(page.getByText('Your wallet. Your crypto.')).toBeVisible()

      // Back to ChooseUnitag
      await page.getByTestId(TestID.Back).click()
      await expect(page.getByText('Choose a username')).toBeVisible()
    })
  },
)
