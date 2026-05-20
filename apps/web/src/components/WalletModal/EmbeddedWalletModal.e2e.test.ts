import { FeatureFlags, getFeatureFlagName } from '@universe/gating'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'

const test = getTest()

const EW_ENABLED = `featureFlagOverride=${getFeatureFlagName(FeatureFlags.EmbeddedWallet)}`
const NOT_CONNECTED = 'eagerlyConnect=false'

test.describe(
  'Embedded Wallet — connections panel',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('Connect button opens EmbeddedWalletConnectionsModal', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()

      const walletModal = getVisibleDropdownElementByTestId(page, 'wallet-modal')
      await expect(walletModal).toBeVisible()
      // EW modal shows "Connect a wallet" heading (not the UniswapWalletOptions header)
      await expect(walletModal.getByText('Connect a wallet')).toBeVisible()
      // EW-specific CTA buttons are rendered
      await expect(getVisibleDropdownElementByTestId(page, TestID.CreateAccount)).toBeVisible()
      await expect(walletModal.getByRole('button', { name: 'Log in' })).toBeVisible()
    })

    test('Create Account button closes connections panel and opens GetTheApp modal', async ({ page }) => {
      await page.goto(`/swap?${NOT_CONNECTED}&${EW_ENABLED}`)

      await page.getByTestId(TestID.NavConnectWalletButton).click()
      await expect(getVisibleDropdownElementByTestId(page, 'wallet-modal')).toBeVisible()

      await getVisibleDropdownElementByTestId(page, TestID.CreateAccount).click()

      // Connections panel should close
      await expect(getVisibleDropdownElementByTestId(page, 'wallet-modal')).not.toBeVisible()
      // GetTheApp modal should open at the GetStarted page
      await expect(page.getByTestId(TestID.DownloadUniswapModal)).toBeVisible()
    })
  },
)
