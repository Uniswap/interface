import { Page } from '@playwright/test'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

async function goToPortfolio({
  page,
  graphql,
  eagerlyConnect,
  externalAddress,
}: {
  page: Page
  graphql: { intercept: (op: string, path: string) => Promise<void>; waitForResponse: (op: string) => Promise<void> }
  eagerlyConnect: boolean
  externalAddress?: string
}): Promise<void> {
  await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
  const baseUrl = externalAddress ? `/portfolio/${externalAddress}` : '/portfolio'
  await page.goto(
    eagerlyConnect ? `${baseUrl}?eagerlyConnectAddress=${HAYDEN_ADDRESS}` : `${baseUrl}?eagerlyConnect=false`,
  )
  await graphql.waitForResponse('PortfolioBalances')
}

test.describe(
  'Portfolio Page Header',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Tab Navigation', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: true })
      })

      test('should display all portfolio tabs', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioTabOverview)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioTabTokens)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioTabNfts)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioTabActivity)).toBeVisible()
      })

      test('should navigate to Tokens tab', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioTabTokens).click()
        await expect(page).toHaveURL(/\/portfolio\/tokens/)
      })

      test('should navigate to NFTs tab', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioTabNfts).click()
        await expect(page).toHaveURL(/\/portfolio\/nfts/)
      })

      test('should navigate to Activity tab', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioTabActivity).click()
        await expect(page).toHaveURL(/\/portfolio\/activity/)
      })

      test('should navigate back to Overview tab', async ({ page }) => {
        // First navigate away from Overview
        await page.getByTestId(TestID.PortfolioTabTokens).click()
        await expect(page).toHaveURL(/\/portfolio\/tokens/)

        // Then navigate back to Overview
        await page.getByTestId(TestID.PortfolioTabOverview).click()
        await expect(page).toHaveURL(/\/portfolio(?!\/tokens|\/nfts|\/activity|\/defi)/)
      })
    })

    test.describe('Demo View (Disconnected User)', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: false })
      })

      test('should show demo wallet display when not connected', async ({ page }) => {
        // Should show "Demo wallet" text for disconnected users
        await expect(page.getByText('Demo wallet')).toBeVisible()
      })

      test('should still show tabs in demo view', async ({ page }) => {
        // Tabs should be visible even in demo mode
        await expect(page.getByTestId(TestID.PortfolioTabOverview)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioTabTokens)).toBeVisible()
      })

      test('should navigate tabs in demo view', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioTabTokens).click()
        await expect(page).toHaveURL(/\/portfolio\/tokens/)

        // Should still show demo wallet after navigation
        await expect(page.getByText('Demo wallet')).toBeVisible()
      })
    })

    test.describe('Connected User Address Display', () => {
      test('should display connected wallet address in portfolio header', async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: true })

        // Wait for portfolio page to load (connected view shows tabs; demo view does not show Overview tab in same way)
        await expect(page.getByTestId(TestID.PortfolioTabOverview)).toBeVisible()

        // Address in portfolio page header (not app header)
        await expect(
          page.getByTestId(TestID.PortfolioHeader).getByText(shortenAddress({ address: HAYDEN_ADDRESS })),
        ).toBeVisible()
      })
    })

    test.describe('External Wallet View', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: false, externalAddress: HAYDEN_ADDRESS })
      })

      test('should show share button when viewing external wallet', async ({ page, graphql }) => {
        // Share button should be visible for external wallets
        await expect(page.getByTestId(TestID.PortfolioShareButton)).toBeVisible()
      })

      test('should preserve external address when navigating tabs', async ({ page, graphql }) => {
        // Navigate to tokens tab
        await page.getByTestId(TestID.PortfolioTabTokens).click()

        // URL should still contain the external address
        await expect(page).toHaveURL(/\/portfolio\/0x50EC05ADe8280758E2077fcBC08D878D4aef79C3\/tokens/)

        // Share button should still be visible
        await expect(page.getByTestId(TestID.PortfolioShareButton)).toBeVisible()
      })
    })

    test.describe('Network Filter', () => {
      test.beforeEach(async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: true })
      })

      test('should filter by Ethereum network and update URL', async ({ page }) => {
        // Open the network filter dropdown (trigger has test id; "All networks" text may be hidden when showDisplayName is false)
        await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()

        // Select Ethereum from the dropdown
        await getVisibleDropdownElementByTestId(page, `${TestID.TokensNetworkFilterOptionPrefix}ethereum`).click()

        // URL should include chain parameter
        await expect(page).toHaveURL(/chain=ethereum/)
      })

      test('should preserve chain filter across tab navigation', async ({ page }) => {
        // First set a chain filter
        await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()
        await getVisibleDropdownElementByTestId(page, `${TestID.TokensNetworkFilterOptionPrefix}ethereum`).click()
        await expect(page).toHaveURL(/chain=ethereum/)

        // Wait for tab links to re-render with chain param (usePortfolioRoutes reads searchParams; avoid clicking stale link)
        await expect(page.getByTestId(TestID.PortfolioTabTokens)).toHaveAttribute('href', /chain=ethereum/)

        // Navigate to tokens tab
        await page.getByTestId(TestID.PortfolioTabTokens).click()

        // Chain parameter should be preserved
        await expect(page).toHaveURL(/chain=ethereum/)
        await expect(page).toHaveURL(/\/portfolio\/tokens/)
      })
    })

    test.describe('Responsive Behavior', () => {
      const MOBILE_VIEWPORT = { width: 375, height: 667 }

      test.beforeEach(async ({ page }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
      })

      test('should display tabs on mobile', async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: true })

        // Tabs should still be visible on mobile
        await expect(page.getByTestId(TestID.PortfolioTabOverview)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioTabTokens)).toBeVisible()
      })

      test('should show share button on mobile for external wallet', async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: false, externalAddress: HAYDEN_ADDRESS })

        // Wait for portfolio page to load (external view) before asserting on header elements
        await expect(page.getByTestId(TestID.PortfolioHeader)).toBeVisible()

        // Share button should be visible on mobile (icon-only when showLabel is false)
        await expect(page.getByTestId(TestID.PortfolioShareButton)).toBeVisible({ timeout: 15000 })
      })

      test('should navigate tabs on mobile', async ({ page, graphql }) => {
        await goToPortfolio({ page, graphql, eagerlyConnect: true })

        await page.getByTestId(TestID.PortfolioTabActivity).click()
        await expect(page).toHaveURL(/\/portfolio\/activity/)
      })
    })
  },
)
