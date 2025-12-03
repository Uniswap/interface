/* eslint-disable no-restricted-syntax */
import type { Page } from '@playwright/test'
import { expect, getTest } from 'playwright/fixtures'
import { HAYDEN_ADDRESS } from 'playwright/fixtures/wallets'
import { Mocks } from 'playwright/mocks/mocks'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
        await page.getByTestId(TestID.WalletSettings).click()
      })
      test('changes theme', async ({ page }) => {
        await page.getByTestId(TestID.ThemeDark).click()
        await expect(page.locator('html')).toHaveClass('t_dark')
        await page.getByTestId(TestID.ThemeLight).click()
        await expect(page.locator('html')).toHaveClass('t_light')
      })

      test('changes language', async ({ page }) => {
        await page.getByTestId(TestID.LanguageSettingsButton).click()
        await page.getByRole('link', { name: 'Spanish (Spain)' }).click()
        await expect(page.getByText('Uniswap está disponible en:')).toBeVisible()
        await page.reload()
        await expect(page.url()).toContain('lng=es-ES')
        await expect(page.getByText('Uniswap está disponible en:')).toBeVisible()
      })

      test('toggles testnet', async ({ page }) => {
        await page.getByTestId(TestID.TestnetsToggle).click()
        await expect(page.getByTestId(TestID.TestnetsToggle)).toHaveAttribute('aria-checked', 'true')
        // Confirm the info modal appears and then close it
        const modalButton = page.getByRole('button', { name: 'Close' })
        await expect(modalButton).toBeVisible()
        await modalButton.click()
      })

      test('disconnected wallet settings should not be accessible', async ({ page }) => {
        await page.goto('/swap?eagerlyConnect=false')
        await page.getByLabel('Navigation button').click()
        await expect(page.getByTestId(TestID.WalletSettings)).not.toBeVisible()
      })

      test('settings on mobile should be accessible via bottom sheet', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 })
        await expect(page.getByTestId(TestID.AccountDrawer).first()).toHaveAttribute('class', /is_Sheet/)
      })
    })

    test.describe('Mini Portfolio account drawer', () => {
      test.beforeEach(async ({ page, graphql }) => {
        // Set up request interception for portfolio balances
        await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
        await graphql.intercept('NftsTab', Mocks.Account.nfts)
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
        await page.getByTestId(TestID.MiniPortfolioPage).waitFor()

        // Close the drawer
        await page.getByTestId(TestID.CloseAccountDrawer).click()
        await expect(page.getByTestId(TestID.AccountDrawer)).not.toBeVisible()

        // Now test opening it a second time (should not trigger another request due to caching)
        const portfolioBalanceCount = await countPortfolioBalancesQueries(page, async () => {
          // Click to open drawer again
          await page.getByTestId(TestID.Web3StatusConnected).click()
          await expect(page.getByTestId(TestID.AccountDrawer)).toBeVisible()
        })

        expect(portfolioBalanceCount).toBe(0)
      })

      test('fetches account information', async ({ page }) => {
        // Open the mini portfolio
        await page.getByTestId(TestID.Web3StatusConnected).click()

        // Wait for the drawer and main content to load
        await expect(page.getByTestId(TestID.AccountDrawer)).toBeVisible()
        await page.getByTestId(TestID.MiniPortfolioPage).waitFor()

        // Verify wallet state - wait for tokens tab to load
        await expect(page.getByTestId(TestID.MiniPortfolioNavbar)).toContainText('Tokens')
        await expect(page.getByTestId(TestID.MiniPortfolioPage)).toContainText('Hidden tokens')

        // Check NFTs section
        await page.getByTestId(TestID.MiniPortfolioNavbar).getByText('NFTs').click()
        await page.waitForTimeout(15_000)
        await expect(
          page.getByTestId(`${TestID.MiniPortfolioNftItem}-${'0x3C90502f0CB0ad0A48c51357E65Ff15247A1D88E'}-${21}`),
        ).toBeVisible()

        // Check Activity section
        await page.getByTestId(TestID.MiniPortfolioNavbar).getByText('Activity').click()
        await expect(page.getByTestId(TestID.MiniPortfolioPage)).toContainText('Contract Interaction')
      })

      test('refetches balances when account changes', async ({ page, graphql }) => {
        // Open account drawer with first account
        await page.getByTestId(TestID.Web3StatusConnected).click()
        const drawer = page.getByTestId(TestID.AccountDrawer)
        await expect(drawer).toBeVisible()
        await page.getByTestId(TestID.MiniPortfolioPage).waitFor()

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
          const newDrawer = page.getByTestId(TestID.AccountDrawer)
          await expect(newDrawer).toBeVisible()
          await page.getByTestId(TestID.MiniPortfolioPage).waitFor()

          // Verify new account address
          await expect(newDrawer.getByText('test0')).toBeVisible()
        })

        // Verify that account change triggered portfolio requests
        expect(portfolioRequestCount).toBeGreaterThanOrEqual(1)
      })
    })
  },
)
