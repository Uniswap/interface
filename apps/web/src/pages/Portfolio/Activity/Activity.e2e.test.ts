import { Page } from '@playwright/test'
import { listTransactions } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { HAYDEN_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

/** Row test IDs from list_transactions mock (transaction.hash). */
const MOCK_ACTIVITY_ROW_IDS = {
  firstReceive: `${TestID.PortfolioActivityTableRowPrefix}0xec087ba7b67d59041c55c06c34c9aea915492e78061ed03343fdf952908e8cdd`,
  firstSend: `${TestID.PortfolioActivityTableRowPrefix}0x73c0cdb742956a55c60374783449e2c2ef087b498611ac480b4d11519ac7b369`,
} as const

async function goToPortfolioActivity({
  page,
  graphql,
  dataApi,
  listTransactionsMock = Mocks.DataApiService.list_transactions,
  externalAddress,
  chain,
}: {
  page: Page
  graphql: { intercept: (op: string, path: string) => Promise<void>; waitForResponse: (op: string) => Promise<void> }
  dataApi: { intercept: (method: { service: { typeName: string }; name: string }, mockPath: string) => Promise<void> }
  listTransactionsMock?: string
  externalAddress?: string
  chain?: string
}): Promise<void> {
  await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
  await dataApi.intercept(listTransactions, listTransactionsMock)

  const base = externalAddress ? `/portfolio/${externalAddress}/activity` : '/portfolio/activity'
  const params = externalAddress ? 'eagerlyConnect=false' : `eagerlyConnectAddress=${HAYDEN_ADDRESS}`
  const query = chain ? `${params}&chain=${chain}` : params

  await page.goto(`${base}?${query}`)
  await page.waitForResponse((res) => res.url().includes('ListTransactions'))
}

test.describe(
  'Portfolio Activity Tab',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('Activity Table Display', () => {
      test.beforeEach(async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({ page, graphql, dataApi })
      })

      test('should display activity table headers', async ({ page }) => {
        await expect(page.getByTestId(TestID.PortfolioActivityTableHeaderTime)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActivityTableHeaderType)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActivityTableHeaderAmount)).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActivityTableHeaderAddress)).toBeVisible()
      })

      test('should display transaction data correctly', async ({ page }) => {
        // Wait for transactions to load - check for transaction types from mock
        // The mock has RECEIVE and SEND transactions with ETH
        const firstReceiveRow = page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)
        await expect(firstReceiveRow).toBeVisible()
        await expect(firstReceiveRow.getByText('ETH')).toBeVisible()
      })

      test('should display both send and receive transactions', async ({ page }) => {
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible()
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstSend)).toBeVisible()
      })
    })

    test.describe('Transaction Type Filter', () => {
      test.beforeEach(async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({ page, graphql, dataApi })
      })

      test('should show filter dropdown with options', async ({ page }) => {
        const filterDropdown = page.getByTestId(TestID.PortfolioActivityTransactionTypeFilter)
        await expect(filterDropdown).toBeVisible()
        await filterDropdown.click()

        await expect(
          getVisibleDropdownElementByTestId(page, `${TestID.PortfolioActivityFilterOptionPrefix}swaps`),
        ).toBeVisible()
        await expect(
          getVisibleDropdownElementByTestId(page, `${TestID.PortfolioActivityFilterOptionPrefix}sends`),
        ).toBeVisible()
        await expect(
          getVisibleDropdownElementByTestId(page, `${TestID.PortfolioActivityFilterOptionPrefix}receives`),
        ).toBeVisible()
      })

      test('should filter to show only sends', async ({ page }) => {
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible()

        await page.getByTestId(TestID.PortfolioActivityTransactionTypeFilter).click()
        await getVisibleDropdownElementByTestId(page, `${TestID.PortfolioActivityFilterOptionPrefix}sends`).click()

        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstSend)).toBeVisible({ timeout: 15000 })
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).not.toBeVisible({ timeout: 15000 })
      })

      test('should filter to show only receives', async ({ page }) => {
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstSend)).toBeVisible()

        await page.getByTestId(TestID.PortfolioActivityTransactionTypeFilter).click()
        await getVisibleDropdownElementByTestId(page, `${TestID.PortfolioActivityFilterOptionPrefix}receives`).click()

        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible({ timeout: 15000 })
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstSend)).not.toBeVisible({ timeout: 15000 })
      })
    })

    test.describe('Empty States', () => {
      test('should show empty state when wallet has no activity', async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({
          page,
          graphql,
          dataApi,
          listTransactionsMock: Mocks.DataApiService.list_transactions_empty,
        })

        const emptyState = page.getByTestId(TestID.PortfolioActivityEmptyState)
        await expect(emptyState).toBeVisible()
        await expect(emptyState.getByText(/no activity/i)).toBeVisible()
      })

      test('should show chain-specific empty state with filter', async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({
          page,
          graphql,
          dataApi,
          listTransactionsMock: Mocks.DataApiService.list_transactions_empty,
          chain: 'optimism',
        })

        const chainEmptyState = page.getByTestId(TestID.PortfolioActivityChainEmptyState)
        await expect(chainEmptyState).toBeVisible()
        await expect(page.getByTestId(TestID.PortfolioActivitySeeAllNetworksButton)).toBeVisible()
      })

      test('should navigate to all activity when clicking "See all networks"', async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({
          page,
          graphql,
          dataApi,
          listTransactionsMock: Mocks.DataApiService.list_transactions_empty,
          chain: 'optimism',
        })

        await page.getByTestId(TestID.PortfolioActivitySeeAllNetworksButton).click()
        await expect(page).toHaveURL(/\/portfolio\/activity(?!\?chain)/)
      })
    })

    test.describe('Transaction Row Interactions', () => {
      test.beforeEach(async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({ page, graphql, dataApi })
      })

      test('should open transaction details modal when clicking a row', async ({ page }) => {
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible()
        await page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive).click()
        await expect(page.getByTestId(TestID.TransactionDetailsModal)).toBeVisible()
      })

      test('should close transaction details modal', async ({ page }) => {
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible()
        await page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive).click()
        await expect(page.getByTestId(TestID.TransactionDetailsModal)).toBeVisible()

        await page.keyboard.press('Escape')
        await expect(page.getByTestId(TestID.TransactionDetailsModal)).not.toBeVisible()
      })
    })

    test.describe('Demo View (Disconnected User)', () => {
      test('should show demo wallet indicator', async ({ page }) => {
        await page.goto('/portfolio/activity?eagerlyConnect=false')
        await expect(page.getByTestId(TestID.DemoWalletDisplay)).toBeVisible()
      })
    })

    test.describe('External Wallet View', () => {
      test.beforeEach(async ({ graphql, dataApi }) => {
        await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
        await dataApi.intercept(listTransactions, Mocks.DataApiService.list_transactions)
      })

      test('should show activity for external wallet', async ({ page, graphql, dataApi }) => {
        await goToPortfolioActivity({ page, graphql, dataApi, externalAddress: HAYDEN_ADDRESS })
        await expect(page.getByTestId(MOCK_ACTIVITY_ROW_IDS.firstReceive)).toBeVisible()
      })

      test('should preserve external address in URL', async ({ page }) => {
        await page.goto(`/portfolio/${HAYDEN_ADDRESS}/activity?eagerlyConnect=false`)

        // URL should contain the external address
        await expect(await page.url()).toContain(HAYDEN_ADDRESS)
      })
    })
  },
)
