import { getPortfolio, listTransactions } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

test.describe(
  'Account Drawer',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Mini Portfolio settings', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        // Mock DataApi so the account drawer doesn't layout-shift mid-hover when the
        // activity/portfolio requests fail (the outage banner mounting breaks the Tooltip hover
        // used by the disconnect flow). Same fix as WalletConnection.e2e.test.ts (#31710).
        await dataApi.intercept(listTransactions, Mocks.DataApiService.list_transactions_empty)
        await dataApi.intercept(getPortfolio, Mocks.DataApiService.get_portfolio_empty)
        await page.goto('/swap')
        await page.getByTestId(TestID.Web3StatusConnected).click()
        await getVisibleDropdownElementByTestId(page, TestID.WalletSettings).click()
      })
      test('changes theme', async ({ page }) => {
        // Match by regex: <html> carries the tamagui theme class alongside the Tailwind
        // `dark` class (toggled by ThemeProvider), so an exact class match would fail.
        await getVisibleDropdownElementByTestId(page, TestID.ThemeDark).click()
        await expect(page.locator('html')).toHaveClass(/t_dark/)
        await getVisibleDropdownElementByTestId(page, TestID.ThemeLight).click()
        await expect(page.locator('html')).toHaveClass(/t_light/)
      })

      test('changes language', async ({ page }) => {
        await getVisibleDropdownElementByTestId(page, TestID.LanguageSettingsButton).click()
        await page.getByRole('link', { name: 'Spanish (Spain)' }).nth(1).click()
        await expect(page.getByText('Intercambio').first()).toBeVisible()
        await page.reload()
        await expect(page.url()).toContain('lng=es-ES')
        await expect(page.getByText('Intercambio').first()).toBeVisible()
      })

      test('toggles testnet', async ({ page }) => {
        await getVisibleDropdownElementByTestId(page, TestID.TestnetsToggle).click()
        await expect(getVisibleDropdownElementByTestId(page, TestID.TestnetsToggle)).toHaveAttribute(
          'aria-checked',
          'true',
        )
        // Confirm the info modal appears and then close it
        const modalButton = page.getByRole('button', { name: 'Close' })
        await expect(modalButton).toBeVisible()
        await modalButton.click()
      })

      test('disconnected wallet settings should not be accessible', async ({ page }) => {
        // Go back to the main menu (beforeEach opened the settings submenu)
        await getVisibleDropdownElementByTestId(page, 'wallet-back').click()
        // Disconnect the wallet. When the Solana flag is enabled, `WalletDisconnect` is a tooltip
        // trigger with no onPress and the actual disconnect row is `WalletDisconnectInModal`
        // inside the tooltip. When disabled, clicking `WalletDisconnect` fires onDisconnect directly.
        const disconnectButton = getVisibleDropdownElementByTestId(page, TestID.WalletDisconnect)
        await disconnectButton.waitFor({ state: 'visible' })
        const disconnectInModal = page.getByTestId(TestID.WalletDisconnectInModal).first()
        const navConnectButton = page.getByTestId(TestID.NavConnectWalletButton)
        // Hover opens the disconnect tooltip (Solana-enabled case). Retry the hover-then-check as a
        // unit so a layout shift mid-hover (e.g. from a late portfolio/activity request) doesn't
        // leave us with a closed tooltip. Same retry pattern as WalletConnection.e2e.test.ts (#31710).
        // If the tooltip never opens, the Solana flag is off and clicking the trigger disconnects
        // directly — fall back to that path.
        let tooltipOpened = false
        try {
          await expect(async () => {
            await disconnectButton.hover()
            await expect(disconnectInModal).toBeVisible({ timeout: 2_000 })
          }).toPass({ timeout: 6_000 })
          tooltipOpened = true
        } catch {
          // Tooltip never opened — Solana flag is off; the trigger itself disconnects on click.
        }
        if (tooltipOpened) {
          await disconnectInModal.click()
        } else {
          await disconnectButton.click()
        }
        await navConnectButton.waitFor({ state: 'visible' })
        // Open the nav menu and verify settings are not visible
        await navConnectButton.click()
        await expect(getVisibleDropdownElementByTestId(page, TestID.WalletSettings)).not.toBeVisible()
      })

      test('settings on mobile should be accessible via bottom sheet', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await expect(page.getByTestId(TestID.AccountDrawer).first()).toHaveAttribute('class', /is_Sheet/)
      })
    })

    test.describe('Mini Portfolio account drawer', () => {
      test.beforeEach(async ({ page }) => {
        await page.goto(`/swap?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
      })

      test('displays account information and recent activity', async ({ page }) => {
        // Open the account drawer
        await page.getByTestId(TestID.Web3StatusConnected).click()

        // Wait for the drawer to load
        const drawer = getVisibleDropdownElementByTestId(page, TestID.AccountDrawer)
        await expect(drawer).toBeVisible()
        await getVisibleDropdownElementByTestId(page, TestID.MiniPortfolioTotalBalance).waitFor()

        // Verify wallet address is displayed
        await expect(drawer.getByText(HAYDEN_ADDRESS.slice(0, 6))).toBeVisible()

        // Verify "View portfolio" button is present (navigates to full portfolio page)
        await expect(drawer.getByText('View portfolio')).toBeVisible()

        // Verify recent activity section is displayed
        await expect(drawer.getByText('Recent activity')).toBeVisible()
      })

      test('refetches balances when account changes', async ({ page }) => {
        // Open account drawer with first account
        await page.getByTestId(TestID.Web3StatusConnected).click()
        const drawer = getVisibleDropdownElementByTestId(page, TestID.AccountDrawer)
        await expect(drawer).toBeVisible()
        await getVisibleDropdownElementByTestId(page, TestID.MiniPortfolioTotalBalance).waitFor()

        // Verify first account address
        await expect(drawer.getByText(HAYDEN_ADDRESS.slice(0, 6))).toBeVisible()

        // Switch to second account (this should trigger new portfolio requests)
        await page.goto(`/swap`)

        // Open drawer with new account
        await page.getByTestId(TestID.Web3StatusConnected).click()
        const newDrawer = getVisibleDropdownElementByTestId(page, TestID.AccountDrawer)
        await expect(newDrawer).toBeVisible()
        await getVisibleDropdownElementByTestId(page, TestID.MiniPortfolioTotalBalance).waitFor()

        // Verify new account address
        await expect(newDrawer.getByText('test0')).toBeVisible()
      })
    })
  },
)
