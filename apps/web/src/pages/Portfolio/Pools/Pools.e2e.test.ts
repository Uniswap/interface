import {
  getPortfolioChart,
  getRewards,
  getWalletBalances,
} from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { FeatureFlags } from '@universe/gating'
import { TestID } from '@universe/test'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { mockGetPortfolioResponse } from '~/playwright/fixtures/account'
import type { DataApiIntercept } from '~/playwright/fixtures/dataApi'
import { mockGetWalletPositions, mockLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

// Deep-linking /pools redirects before the URL flag override applies, so tests start on the Overview.
const buildUrl = createTestUrlBuilder({
  basePath: '/portfolio',
  defaultFeatureFlags: { [FeatureFlags.PortfolioPoolsBalances]: true },
})

const TOTAL_BALANCE = '$38,682,157.99'
const TOKENS_BALANCE = '$38,676,499.90'
const POOLS_BALANCE = '$5,658.09'
const POOLS_FEES = '$77.50'

const ETH_USDT_V4_ROW = `${TestID.PositionsTableRowPrefix}0x72331fcb696b0151904c03584b66dc8365bc63f8a144d89a773384e3a579ca73-13281-1`
const USDC_WETH_V3_ROW = `${TestID.PositionsTableRowPrefix}0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640-1028438-1`

async function goToPortfolioOverview({
  page,
  dataApi,
  connected = false,
  walletBalancesMock = Mocks.DataApiService.get_wallet_balances_with_pools,
  chartMock = Mocks.DataApiService.get_portfolio_chart_with_pools,
  positionsMock = Mocks.LiquidityService.get_wallet_positions,
  positionsBalanceMock = Mocks.LiquidityService.get_wallet_positions_balance,
}: {
  page: Page
  dataApi: DataApiIntercept
  /** Own-wallet view renders Collect actions; the default external view is read-only. */
  connected?: boolean
  walletBalancesMock?: string
  chartMock?: string
  positionsMock?: string
  positionsBalanceMock?: string
}): Promise<void> {
  await mockGetPortfolioResponse({ page })
  await dataApi.intercept(getWalletBalances, walletBalancesMock)
  await dataApi.intercept(getPortfolioChart, chartMock)
  await dataApi.intercept(getRewards, Mocks.DataApiService.get_rewards_empty)
  await mockGetWalletPositions({ page, mockPath: positionsMock })
  await mockLiquidityServiceEndpoint({
    page,
    service: LiquidityService,
    endpoint: LiquidityService.methods.getWalletPositionsBalance,
    mockPath: positionsBalanceMock,
  })

  const walletBalancesResponse = page.waitForResponse((res) => res.url().includes('GetWalletBalances'))
  if (connected) {
    await page.goto(buildUrl({ queryParams: { eagerlyConnectAddress: HAYDEN_ADDRESS } }))
    await expect(page.getByTestId(TestID.DemoWalletDisplay)).not.toBeVisible()
  } else {
    await page.goto(buildUrl({ subPath: HAYDEN_ADDRESS, queryParams: { eagerlyConnect: 'false' } }))
  }
  await walletBalancesResponse
}

async function openPoolsTab(page: Page): Promise<void> {
  const positionsResponse = page.waitForResponse(
    (res) => res.url().includes('GetWalletPositions') && !res.url().includes('GetWalletPositionsBalance'),
  )
  await page.getByTestId(TestID.PortfolioTabPools).click()
  await expect(page).toHaveURL(/\/portfolio\/.*pools/)
  await positionsResponse
}

test.describe(
  'Portfolio Pools Tab',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Overview header', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        await goToPortfolioOverview({ page, dataApi })
      })

      test('should include pools in the total balance', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioTotalBalance)).toContainText(TOTAL_BALANCE)
      })

      test('should split tokens and pools in the balance breakdown popover', async ({ page }) => {
        await page.getByTestId(TestID.BalanceBreakdownPopover).hover()

        await expect(page.getByTestId(TestID.BalanceBreakdownRowTokens)).toContainText(TOKENS_BALANCE)
        await expect(page.getByTestId(TestID.BalanceBreakdownRowPools)).toContainText(POOLS_BALANCE)
        await expect(page.getByTestId(TestID.BalanceBreakdownRowEarn)).not.toBeVisible()
      })
    })

    test.describe('Pools tab', () => {
      test.beforeEach(async ({ page, dataApi }) => {
        await goToPortfolioOverview({ page, dataApi })
      })

      test('should show the Pools tab and navigate to it', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioTabPools)).toBeVisible()
        await openPoolsTab(page)
        await expect(page).toHaveURL(new RegExp(`/portfolio/${HAYDEN_ADDRESS}/pools`))
      })

      test('should show the pools balance header and summary chips', async ({ page }) => {
        await openPoolsTab(page)

        const balanceHeader = page.getByTestId(TestID.PortfolioBalance)
        await expect(balanceHeader).toContainText(POOLS_BALANCE)
        await expect(balanceHeader).toContainText('2 positions')

        await expect(page.getByTestId(TestID.PositionsSummaryTotalLiquidity)).toHaveText(POOLS_BALANCE)
        await expect(page.getByTestId(TestID.PositionsSummaryTotalFees)).toHaveText(POOLS_FEES)
        await expect(page.getByTestId(TestID.PositionsSummaryCollectFees)).not.toBeVisible()
      })

      test('should render the positions table rows', async ({ page }) => {
        await openPoolsTab(page)

        const ethUsdtRow = page.getByTestId(ETH_USDT_V4_ROW)
        await expect(ethUsdtRow).toBeVisible()
        await expect(page.getByTestId(USDC_WETH_V3_ROW)).toBeVisible()
        await expect(ethUsdtRow).toHaveAttribute('href', /\/explore\/pools\/ethereum\//)
      })
    })

    test.describe('Empty state', () => {
      test('should show the no-positions view when the wallet has no pools', async ({ page, dataApi }) => {
        await goToPortfolioOverview({
          page,
          dataApi,
          walletBalancesMock: Mocks.DataApiService.get_wallet_balances_pools_empty,
          chartMock: Mocks.DataApiService.get_portfolio_chart_pools_empty,
          positionsMock: Mocks.LiquidityService.get_wallet_positions_empty,
          positionsBalanceMock: Mocks.LiquidityService.get_wallet_positions_balance_empty,
        })
        await openPoolsTab(page)

        await expect(page.getByTestId(TestID.PositionsEmptyState)).toBeVisible()
        await expect(page.getByTestId(TestID.PositionsSummaryTotalLiquidity)).not.toBeVisible()
        await expect(page.getByRole('link', { name: 'Explore pools' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'New position' })).not.toBeVisible()
      })
    })

    test.describe('Collect fees', () => {
      test('should open the claim fees flow from the fees chip', async ({ page, dataApi }) => {
        await goToPortfolioOverview({ page, dataApi, connected: true })
        await openPoolsTab(page)

        const collectFees = page.getByTestId(TestID.PositionsSummaryCollectFees)
        await expect(collectFees).toBeEnabled()
        await collectFees.click()

        const feesModal = page.getByTestId(TestID.YourFeesModal)
        await expect(feesModal).toBeVisible()
        await expect(page.getByTestId(TestID.YourFeesModalTotal)).toHaveText(POOLS_FEES)
        const feeRows = page.getByTestId(TestID.PortfolioPoolsFeesRow)
        await expect(feeRows).toHaveCount(1)

        await feesModal.getByRole('button', { name: 'Collect', exact: true }).click()

        // Submitting the claim is covered by ClaimFees.anvil.e2e.test.ts.
        await expect(feesModal).not.toBeVisible()
        await expect(page.getByTestId(TestID.ClaimFees)).toBeVisible()
        await page.getByTestId(TestID.ClaimFeeModalClose).click()
        await expect(page.getByTestId(TestID.ClaimFees)).not.toBeVisible()
      })
    })
  },
)
