import { Page } from '@playwright/test'
import {
  getWalletBalances,
  listTransactions,
} from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { mockGetPortfolioResponse } from '~/playwright/fixtures/account'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

// Token row ID from portfolio mock (chainId-address, lowercase) for Tether USD
const USDT_TOKEN_ID = '1-0xdac17f958d2ee523a2206206994597c13d831ec7'

type DataApiFixture = {
  intercept: (method: { service: { typeName: string }; name: string }, mockPath: string) => Promise<void>
}

async function goToPortfolioOverview({
  page,
  dataApi,
  getPortfolioMock = Mocks.DataApiService.get_portfolio,
  externalAddress,
  waitForGetPortfolio = true,
  waitForListTransactions = true,
}: {
  page: Page
  dataApi?: DataApiFixture
  getPortfolioMock?: string | null
  externalAddress?: string
  waitForGetPortfolio?: boolean
  waitForListTransactions?: boolean
}): Promise<void> {
  if (dataApi) {
    await dataApi.intercept(listTransactions, Mocks.DataApiService.list_transactions)
  }
  if (getPortfolioMock) {
    await mockGetPortfolioResponse({ page, mockPath: getPortfolioMock })
  }

  const waits: Promise<unknown>[] = []
  if (waitForGetPortfolio) {
    waits.push(page.waitForResponse((res) => res.request().url().includes('GetPortfolio')))
  }
  if (waitForListTransactions) {
    waits.push(page.waitForResponse((res) => res.url().includes('ListTransactions')))
  }

  // Always navigate as external wallet (address in URL path) so isExternalWallet=true and the
  // demo overlay (pointer-events:none) never blocks interactions, regardless of wallet connect timing.
  const address = externalAddress ?? HAYDEN_ADDRESS
  await page.goto(`/portfolio/${address}?eagerlyConnect=false`)
  await Promise.all(waits)
}

test.describe(
  'Portfolio Overview Tab',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Portfolio Chart', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        await goToPortfolioOverview({ page, dataApi, waitForListTransactions: false })
      })

      test('should display portfolio value', async ({ page }) => {
        // Portfolio should show a dollar value (the hayden mock has ~$430)
        await expect(page.getByTestId(TestID.PortfolioTotalBalance)).toBeVisible()
      })

      test('should display time period selector', async ({ page }) => {
        // Time period options should be visible
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1d`)).toBeVisible()
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1w`)).toBeVisible()
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1m`)).toBeVisible()
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1y`)).toBeVisible()
      })

      test('should change time period when clicking selector', async ({ page }) => {
        // Click on 1W to change time period
        await page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1w`).click()

        // The 1W button should now be selected (we can verify by checking it's visible)
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1w`)).toBeVisible()
      })
    })

    test.describe('Action Tiles - Connected Wallet', () => {
      test.beforeEach(async ({ page }) => {
        // Navigate with eagerlyConnectAddress (not in path) so isExternalWallet=false.
        // Wallet connect is async, so explicitly wait for the demo overlay to leave the DOM.
        await page.goto(`/portfolio?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
        await expect(page.getByTestId(TestID.DemoWalletDisplay)).not.toBeVisible()
      })

      test('should display connected wallet action tiles', async ({ page }) => {
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileBuy)).toBeVisible()
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileMore)).toBeVisible()
      })

      test('should not show CopyAddress or Share tiles for connected wallet', async ({ page }) => {
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileBuy)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActionTileCopyAddress)).not.toBeVisible()
        // Scope to the action tiles: the portfolio header renders its own share button
        // (same test ID), which is visible by design for connected wallets.
        await expect(actionTiles.getByTestId(TestID.PortfolioShareButton)).not.toBeVisible()
      })
    })

    test.describe('Action Tiles - External Wallet', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        await goToPortfolioOverview({
          page,
          dataApi,
          externalAddress: HAYDEN_ADDRESS,
          waitForListTransactions: false,
        })
      })

      test('should display external wallet action tiles', async ({ page }) => {
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileSend)).toBeVisible()
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileCopyAddress)).toBeVisible()
      })

      test('should not show Swap, Buy, or More tiles for external wallet', async ({ page }) => {
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileSend)).toBeVisible()

        // These should NOT be visible for external wallet
        await expect(page.getByTestId(TestID.PortfolioActionTileSwap)).not.toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActionTileBuy)).not.toBeVisible()
      })
    })

    test.describe('Mini Tokens Table', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        // Token rows come from GetPortfolio only.
        await goToPortfolioOverview({ page, dataApi, waitForListTransactions: false })
      })

      test('should display tokens section header', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewTokensSection)).toBeVisible()
      })

      test('should display token data from portfolio', async ({ page }) => {
        // GetPortfolio mock has USDT (and ETH, USDC)
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
      })

      test('should display View all tokens button', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewViewAllTokens)).toBeVisible()
      })

      test('should navigate to tokens tab when clicking View all tokens', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioOverviewViewAllTokens).click()
        await expect(page).toHaveURL(/\/portfolio\/.+\/tokens/)
      })

      test('should navigate to token details when clicking a token row', async ({ page }) => {
        await page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`).click()
        await expect(page).toHaveURL(/\/explore\/tokens\/ethereum/)
      })
    })

    test.describe('Mini Activity Table', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        await goToPortfolioOverview({
          page,
          dataApi,
          getPortfolioMock: null,
          waitForGetPortfolio: false,
        })
      })

      test('should display activity section', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewActivitySection)).toBeVisible()
      })

      test('should display View all activity button', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewViewAllActivity)).toBeVisible()
      })

      test('should navigate to activity tab when clicking View all activity', async ({ page }) => {
        await page.getByTestId(TestID.PortfolioOverviewViewAllActivity).click()
        await expect(page).toHaveURL(/\/portfolio\/.+\/activity/)
      })
    })

    test.describe('Empty Portfolio State', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        // useIsPortfolioZero reads GetWalletBalances (not GetPortfolio), so mock both to zero.
        // useActivityData is skipped when isPortfolioZero, so ListTransactions is never called.
        await dataApi.intercept(getWalletBalances, Mocks.DataApiService.get_wallet_balances_empty)
        await goToPortfolioOverview({
          page,
          getPortfolioMock: Mocks.DataApiService.get_portfolio_empty,
          waitForListTransactions: false,
        })
      })

      test('should show zero balance for empty portfolio', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewEmptyBalance)).toBeVisible()
      })

      test('should not show mini tables for empty portfolio', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioOverviewEmptyBalance)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioOverviewViewAllTokens)).not.toBeVisible()
      })
    })

    test.describe('Demo View (Disconnected User)', () => {
      test('should show demo wallet indicator', async ({ page }) => {
        await page.goto('/portfolio?eagerlyConnect=false')
        await expect(page.getByTestId(TestID.DemoWalletDisplay)).toBeVisible()
      })

      test('should display action tiles in demo view', async ({ page }) => {
        await page.goto('/portfolio?eagerlyConnect=false')
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileBuy)).toBeVisible()
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileReceive)).toBeVisible()
      })

      test('should display demo portfolio data', async ({ page }) => {
        await page.goto('/portfolio?eagerlyConnect=false')
        await expect(page.getByTestId(TestID.PortfolioTotalBalance)).toBeVisible()
      })
    })

    test.describe('External Wallet View', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        // Token row and share UI need GetPortfolio only.
        await goToPortfolioOverview({
          page,
          dataApi,
          externalAddress: HAYDEN_ADDRESS,
          waitForListTransactions: false,
        })
      })

      test('should display external wallet portfolio', async ({ page }) => {
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
      })

      test('should preserve external address in URL', async ({ page }) => {
        // URL should contain the external address
        await expect(page).toHaveURL(/\/portfolio\/0x50EC05ADe8280758E2077fcBC08D878D4aef79C3/)
      })

      test('should show Share button for external wallet', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioShareButton)).toBeVisible()
      })
    })

    test.describe('Network Filter Integration', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        // Filter and View all tokens link need GetPortfolio only.
        await goToPortfolioOverview({ page, dataApi, waitForListTransactions: false })
      })

      test('should filter overview data by network', async ({ page }) => {
        await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()
        const ethereumOption = getVisibleDropdownElementByTestId(page, `${ElementName.NetworkButton}-1`)
        await ethereumOption.waitFor({ state: 'visible' })
        await ethereumOption.click()
        await page.waitForURL(/chain=ethereum/)
      })

      test('should preserve chain filter when navigating to tokens tab', async ({ page }) => {
        await page.getByTestId(TestID.TokensNetworkFilterTrigger).click()
        const ethereumOption = getVisibleDropdownElementByTestId(page, `${ElementName.NetworkButton}-1`)
        await ethereumOption.waitFor({ state: 'visible' })
        await ethereumOption.click()
        await page.waitForURL(/chain=ethereum/)

        const viewAllTokensButton = page.getByTestId(TestID.PortfolioOverviewViewAllTokens)
        // href is on the wrapping <a>; test id is on the child Button (same pattern as Mini Tokens Table tests).
        await expect(page.locator(`a:has([data-testid="${TestID.PortfolioOverviewViewAllTokens}"])`)).toHaveAttribute(
          'href',
          /chain=ethereum/,
        )
        await viewAllTokensButton.click()
        await expect(page).toHaveURL(/chain=ethereum/)
        await expect(page).toHaveURL(/\/portfolio\/.+\/tokens/)
      })
    })

    test.describe('Responsive Behavior', () => {
      const MOBILE_VIEWPORT = { width: 375, height: 667 }

      test.beforeEach(async ({ page, dataApi }) => {
        await page.setViewportSize(MOBILE_VIEWPORT)
        // Chart, tiles, token row need GetPortfolio only.
        await goToPortfolioOverview({ page, dataApi, waitForListTransactions: false })
      })

      test('should display overview chart on mobile', async ({ page }) => {
        await expect(page.getByTestId(`${TestID.PortfolioChartPeriodPrefix}1d`)).toBeVisible()
      })

      test('should display action tiles on mobile', async ({ page }) => {
        const actionTiles = page.getByTestId(TestID.PortfolioActionTiles)
        await expect(actionTiles.getByTestId(TestID.PortfolioActionTileSend)).toBeVisible()
      })

      test('should display tokens table on mobile', async ({ page }) => {
        await expect(page.getByTestId(`${TestID.TokenTableRowPrefix}${USDT_TOKEN_ID}`)).toBeVisible()
      })
    })
  },
)
