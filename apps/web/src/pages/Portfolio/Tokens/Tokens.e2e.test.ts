import { Page } from '@playwright/test'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { mockGetPortfolioResponse } from '~/playwright/fixtures/account'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks, PortfolioBalancesMocks } from '~/playwright/mocks/mocks'

// Token row IDs from GetPortfolio mock (chainId-address, lowercase)
const USDT_TOKEN_ID = '1-0xdac17f958d2ee523a2206206994597c13d831ec7' // Tether USD / USDT
const USDC_TOKEN_ID = '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' // USD Coin / USDC
// Hidden token row ID from GetPortfolio mock (get_portfolio.json) - Bridged USDC on Polygon
const HIDDEN_TOKEN_ID = '137-0x2791bca1f2de4661ed88a30c99a7a9449aa84174'

const test = getTest()

async function goToPortfolioTokens({
  page,
  graphql,
  mock = Mocks.PortfolioBalances.hayden,
  getPortfolioMock,
  externalAddress,
  chain,
}: {
  page: Page
  graphql: { intercept: (op: string, path: string) => Promise<void>; waitForResponse: (op: string) => Promise<void> }
  mock?: string
  getPortfolioMock?: string
  externalAddress?: string
  chain?: string
}): Promise<void> {
  const portfolioMock =
    getPortfolioMock ??
    (mock === PortfolioBalancesMocks.empty
      ? Mocks.DataApiService.get_portfolio_empty
      : Mocks.DataApiService.get_portfolio)

  await graphql.intercept('PortfolioBalances', mock)
  await mockGetPortfolioResponse({ page, mockPath: portfolioMock })

  const base = externalAddress ? `/portfolio/${externalAddress}/tokens` : '/portfolio/tokens'
  const params = externalAddress ? 'eagerlyConnect=false' : `eagerlyConnectAddress=${HAYDEN_ADDRESS}`
  const query = chain ? `${params}&chain=${chain}` : params

  await page.goto(`${base}?${query}`)
}

test.describe(
  'Portfolio Tokens Tab',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Token Table Display', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql })
      })

      test('should display tokens table with visible tokens', async ({ page }) => {
        // Verify table headers are visible
        await expect(page.getByText('Token', { exact: true })).toBeVisible()
        await expect(page.getByText('Price', { exact: true })).toBeVisible()
        await expect(page.getByText('1D change', { exact: true })).toBeVisible()
        await expect(page.getByText('Balance', { exact: true })).toBeVisible()
        await expect(page.getByText('Value', { exact: true })).toBeVisible()
        await expect(page.getByText('Allocation', { exact: true })).toBeVisible()
      })

      test('should display token data correctly', async ({ page }) => {
        const firstTokenRow = page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)
        await expect(firstTokenRow).toBeVisible()
      })

      test('should display portfolio balance', async ({ page }) => {
        // Portfolio balance should be visible at the top
        // The hayden mock has ~$430 total value
        await expect(page.getByTestId(TestID.PortfolioBalance)).toBeVisible()
      })

      test('should display token count indicator', async ({ page }) => {
        // The hayden mock has 5 visible tokens
        await expect(page.getByText(/\d+ tokens?/)).toBeVisible()
      })
    })

    test.describe('Hidden Tokens', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql })
      })

      test('should display hidden tokens expando row', async ({ page }) => {
        // GetPortfolio mock has 1 hidden token (Bridged USDC)
        await expect(page.getByTestId(TestID.ShowHiddenTokens)).toBeVisible()
      })

      test('should expand hidden tokens when clicking expando row', async ({ page }) => {
        // Click the expando row to show hidden tokens
        await page.getByTestId(TestID.ShowHiddenTokens).click()

        // Hidden tokens should now be visible - check for the hidden token row from GetPortfolio mock
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${HIDDEN_TOKEN_ID}`)).toBeVisible()
      })

      test('should collapse hidden tokens when clicking expando row again', async ({ page }) => {
        // First expand
        await page.getByTestId(TestID.ShowHiddenTokens).click()
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${HIDDEN_TOKEN_ID}`)).toBeVisible()

        // Then collapse
        await page.getByTestId(TestID.ShowHiddenTokens).click()

        // Hidden token row should no longer be visible
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${HIDDEN_TOKEN_ID}`)).not.toBeVisible()
      })

      test('should display hidden tokens info banner when expanded', async ({ page }) => {
        // Expand hidden tokens
        await page.getByTestId(TestID.ShowHiddenTokens).click()

        // Info banner should be visible
        await expect(page.getByTestId(TestID.HiddenTokensInfoBanner)).toBeVisible()
      })
    })

    test.describe('Search Functionality', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql })
      })

      test('should filter tokens by name', async ({ page }) => {
        // Type in search input
        await page.getByTestId(TestID.PortfolioTokensSearchInput).fill('Tether')

        // Should show matching token
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()

        // Should not show non-matching tokens
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDC_TOKEN_ID}`)).not.toBeVisible()
      })

      test('should filter tokens by symbol', async ({ page }) => {
        // Type in search input
        await page.getByTestId(TestID.PortfolioTokensSearchInput).fill('USDC')

        // Should show matching token
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDC_TOKEN_ID}`)).toBeVisible()

        // Should not show non-matching tokens
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).not.toBeVisible()
      })

      test('should show no results message when search has no matches', async ({ page }) => {
        // Type a search term that won't match any tokens
        await page.getByTestId(TestID.PortfolioTokensSearchInput).fill('NONEXISTENTTOKEN123')

        // Should show no results message
        await expect(page.getByTestId(TestID.PortfolioTokensNoResults)).toBeVisible()
      })

      test('should clear search and show all tokens', async ({ page }) => {
        // First search for something
        const searchInput = page.getByTestId(TestID.PortfolioTokensSearchInput)
        await searchInput.fill('USDC')
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).not.toBeVisible()

        // Clear search
        await searchInput.clear()

        // All tokens should be visible again
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDC_TOKEN_ID}`)).toBeVisible()
      })
    })

    test.describe('Token Row Interactions', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql })
      })

      test('should navigate to token details when clicking a token row', async ({ page }) => {
        // Wait for tokens to load
        const usdtRow = page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)
        await expect(usdtRow).toBeVisible()

        // Click on the USDT row
        await usdtRow.click()

        // Should navigate to token details page
        await expect(page).toHaveURL(/\/explore\/tokens\/ethereum\/0xdAC17F958D2ee523a2206206994597C13D831ec7/i)
      })

      test('should show context menu button on row hover', async ({ page }) => {
        // Wait for tokens to load
        const usdtRow = page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)
        await expect(usdtRow).toBeVisible()

        // Hover over the row
        await usdtRow.hover()

        // Context menu button (three dots) should appear in this row (wait for opacity transition)
        await expect(usdtRow.getByTestId(TestID.TokenTableRowContextMenuButton)).toBeVisible({ timeout: 1000 })
      })
    })

    test.describe('Empty States', () => {
      test('should show empty state when wallet has no tokens', async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql, mock: PortfolioBalancesMocks.empty })

        // Should show empty state message
        await expect(page.getByTestId(TestID.PortfolioTokensEmptyState)).toBeVisible()
      })

      test('should show chain-specific empty state with filter', async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql, mock: PortfolioBalancesMocks.empty, chain: 'optimism' })

        // Should show chain-specific empty state
        await expect(page.getByTestId(TestID.PortfolioTokensEmptyState)).toBeVisible()

        // Should show "See all networks" button
        await expect(page.getByTestId(TestID.PortfolioTokensSeeAllNetworksButton)).toBeVisible()
      })

      test('should navigate to all tokens when clicking "See all networks"', async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql, mock: PortfolioBalancesMocks.empty, chain: 'optimism' })

        // Click "See all networks" button
        await page.getByTestId(TestID.PortfolioTokensSeeAllNetworksButton).click()

        // Should navigate to tokens page without chain filter
        await expect(page).toHaveURL(/\/portfolio\/tokens/)
        await expect(page.url()).not.toContain('chain=')
      })
    })

    test.describe('Demo View (Disconnected User)', () => {
      test('should show demo wallet tokens', async ({ page }) => {
        await page.goto('/portfolio/tokens?eagerlyConnect=false')

        // Should show demo wallet indicator
        await expect(page.getByTestId(TestID.DemoWalletDisplay)).toBeVisible()

        // Demo wallet should still show some content
        // Note: The demo view may show different content or a prompt to connect
      })
    })

    test.describe('External Wallet View', () => {
      test('should show tokens for external wallet', async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql, externalAddress: HAYDEN_ADDRESS })

        // Should show the wallet's tokens
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
      })

      test('should preserve external address in URL', async ({ page, graphql }) => {
        await goToPortfolioTokens({ page, graphql, externalAddress: HAYDEN_ADDRESS })

        // URL should contain the external address
        expect(page.url()).toContain(HAYDEN_ADDRESS)
      })
    })

    test.describe('Responsive Behavior', () => {
      const MOBILE_VIEWPORT = { width: 375, height: 667 }

      test('should display tokens on mobile', async ({ page, graphql }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
        await goToPortfolioTokens({ page, graphql })

        // Tokens should still be visible
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
      })

      test('should have full-width search input on mobile', async ({ page, graphql }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
        await goToPortfolioTokens({ page, graphql })

        // Search input should be visible and functional
        const searchInput = page.getByTestId(TestID.PortfolioTokensSearchInput)
        await expect(searchInput).toBeVisible()

        // Type in search
        await searchInput.fill('USDC')
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDC_TOKEN_ID}`)).toBeVisible()
      })
    })
  },
)
