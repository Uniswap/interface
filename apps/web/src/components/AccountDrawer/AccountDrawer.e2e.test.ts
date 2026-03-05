/* eslint-disable no-restricted-syntax */
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const GRAPHQL_URL = /(gateway|api)\.uniswap\.org/

async function countPortfolioBalancesQueries(page: Page, actions: () => Promise<void>) {
  let portfolioBalanceCount = 0

  await page.route(GRAPHQL_URL, async (route) => {
    const postData = route.request().postData()
    if (postData?.includes('PortfolioBalances')) {
      portfolioBalanceCount++
    }
    await route.continue()
  })

  // Wait for the actions to complete
  await actions()

  return portfolioBalanceCount
}

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
      test.beforeEach(async ({ page }) => {
        await page.goto('/swap')
        await page.getByTestId(TestID.Web3StatusConnected).click()
        await getVisibleDropdownElementByTestId(page, TestID.WalletSettings).click()
      })
      test('changes theme', async ({ page }) => {
        await getVisibleDropdownElementByTestId(page, TestID.ThemeDark).click()
        await expect(page.locator('html')).toHaveClass('t_dark')
        await getVisibleDropdownElementByTestId(page, TestID.ThemeLight).click()
        await expect(page.locator('html')).toHaveClass('t_light')
      })

      test('changes language', async ({ page }) => {
        await getVisibleDropdownElementByTestId(page, TestID.LanguageSettingsButton).click()
        await page.getByRole('link', { name: 'Spanish (Spain)' }).nth(1).click()
        await expect(page.getByText('Uniswap está disponible en:')).toBeVisible()
        await page.reload()
        await expect(page.url()).toContain('lng=es-ES')
        await expect(page.getByText('Uniswap está disponible en:')).toBeVisible()
      })

      test('toggles testnet', async ({ page }) => {
        await getVisibleDropdownElementByTestId(page, TestID.AdvancedSettingsButton).click()
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
        // Disconnect the wallet
        await getVisibleDropdownElementByTestId(page, TestID.WalletDisconnect).hover()
        await page.getByTestId(TestID.WalletDisconnectInModal).click()
        // Open the nav menu and verify settings are not visible
        await page.getByTestId(TestID.NavConnectWalletButton).click()
        await expect(getVisibleDropdownElementByTestId(page, TestID.WalletSettings)).not.toBeVisible()
      })

      test('settings on mobile should be accessible via bottom sheet', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await expect(page.getByTestId(TestID.AccountDrawer).first()).toHaveAttribute('class', /is_Sheet/)
      })
    })

    test.describe('Mini Portfolio account drawer', () => {
      test.beforeEach(async ({ page, graphql }) => {
        // Set up request interception for portfolio balances and activity
        await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
        await graphql.intercept('ActivityWeb', Mocks.Account.full_activity_history)
        await page.goto(`/swap?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
      })

      test('should fetch balances when the account drawer is opened', async ({ page }) => {
        const portfolioBalanceCount = await countPortfolioBalancesQueries(page, async () => {
          // Click to open drawer
          await page.getByTestId(TestID.Web3StatusConnected).click()
          await expect(page.getByTestId(TestID.AccountDrawer)).toBeVisible()
        })

        expect(portfolioBalanceCount).toBe(1)
      })

      test('should not re-fetch balances on second open', async ({ page }) => {
        // First, open drawer and let it fetch data (this should trigger a request)
        await page.getByTestId(TestID.Web3StatusConnected).click()
        await expect(page.getByTestId(TestID.AccountDrawer)).toBeVisible()

        // Wait for the portfolio data to actually load
        await getVisibleDropdownElementByTestId(page, TestID.MiniPortfolioTotalBalance).waitFor()

        // Close the dropdown by pressing Escape
        await page.keyboard.press('Escape')
        await expect(page.getByTestId(TestID.AccountDrawer)).not.toBeVisible()

        // Now test opening it a second time (should not trigger another request due to caching)
        const portfolioBalanceCount = await countPortfolioBalancesQueries(page, async () => {
          // Click to open drawer again
          await page.getByTestId(TestID.Web3StatusConnected).click()
          await expect(page.getByTestId(TestID.AccountDrawer)).toBeVisible()
        })

        expect(portfolioBalanceCount).toBe(0)
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

      test('refetches balances when account changes', async ({ page, graphql }) => {
        // Open account drawer with first account
        await page.getByTestId(TestID.Web3StatusConnected).click()
        const drawer = getVisibleDropdownElementByTestId(page, TestID.AccountDrawer)
        await expect(drawer).toBeVisible()
        await getVisibleDropdownElementByTestId(page, TestID.MiniPortfolioTotalBalance).waitFor()

        // Verify first account address
        await expect(drawer.getByText(HAYDEN_ADDRESS.slice(0, 6))).toBeVisible()

        // Set up mock data for second account
        await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.test_wallet)

        // Count portfolio requests triggered by account change
        const portfolioRequestCount = await countPortfolioBalancesQueries(page, async () => {
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

        // Verify that account change triggered portfolio requests
        expect(portfolioRequestCount).toBeGreaterThanOrEqual(1)
      })
    })
  },
)
