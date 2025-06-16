/* eslint-disable no-restricted-syntax */
import type { Page, Request } from '@playwright/test'
import { expect, test } from 'playwright/fixtures'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { Mocks } from 'playwright/mocks/mocks'
import { WEB_FEATURE_FLAG_NAMES } from 'uniswap/src/features/gating/flags'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const GRAPHQL_URL = /(?:interface|beta).(gateway|api).uniswap.org\/v1\/graphql/

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

async function overrideFeatureFlags(page: Page): Promise<void> {
  const flags = Array.from(WEB_FEATURE_FLAG_NAMES.values()).join(',')
  await page.goto(`/swap?featureFlagOverrideOff=${flags}`)
}

test.describe('Mini Portfolio account drawer', () => {
  test.beforeEach(async ({ page, graphql }) => {
    // Set up request interception for portfolio balances
    await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.hayden)
    await graphql.intercept('NftBalance', Mocks.Account.nfts)
    await graphql.intercept('ActivityWeb', Mocks.Account.full_activity_history)
    await page.goto(`/swap?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)
  })

  test('fetches balances when account button is first hovered', async ({ page }) => {
    const portfolioRequestPromise = page.waitForRequest((request: Request) => {
      const postData = request.postData()
      return (
        (request.url().includes('beta.api.uniswap.org/v1/graphql') && postData?.includes('PortfolioBalances')) ?? false
      )
    })

    // Wait for and hover over the account button
    const accountButton = page.getByTestId(TestID.Web3StatusConnected)
    await accountButton.waitFor({ state: 'visible' })
    await accountButton.hover()

    // Wait for and verify the portfolio request
    const request = await portfolioRequestPromise
    expect(request).toBeTruthy()
  })

  test('should not re-fetch balances on second hover', async ({ page }) => {
    // When a feature flag returns true after some time, the balance is re-fetched which interferes with this test.
    await overrideFeatureFlags(page)

    const portfolioBalanceCount = await countPortfolioBalancesQueries(page, async () => {
      // First hover
      await page.getByTestId(TestID.Web3StatusConnected).hover()

      // Second hover
      await page.getByTestId(TestID.Web3StatusConnected).hover()
    })

    expect(portfolioBalanceCount).toBe(1)
  })

  test('should not re-fetch balances when the account drawer is opened', async ({ page }) => {
    // When a feature flag returns true after some time, the balance is re-fetched which interferes with this test.
    await overrideFeatureFlags(page)

    const portfolioBalanceCount = await countPortfolioBalancesQueries(page, async () => {
      // First hover
      await page.getByTestId(TestID.Web3StatusConnected).hover()

      // Click to open drawer
      await page.getByTestId(TestID.Web3StatusConnected).click()
    })

    expect(portfolioBalanceCount).toBe(1)
  })

  test('fetches account information', async ({ page }) => {
    // Open the mini portfolio
    await page.getByTestId(TestID.Web3StatusConnected).click()

    // Verify wallet state
    await expect(page.getByTestId(TestID.MiniPortfolioNavbar)).toContainText('Tokens')
    await expect(page.getByTestId(TestID.MiniPortfolioPage)).toContainText('Hidden (5)')

    // Check NFTs section
    await page.getByTestId(TestID.MiniPortfolioNavbar).getByText('NFTs').click()
    await expect(page.getByTestId(TestID.MiniPortfolioPage)).toContainText('I Got Plenty')

    // Check Activity section
    await page.getByTestId(TestID.MiniPortfolioNavbar).getByText('Activity').click()
    await expect(page.getByTestId(TestID.MiniPortfolioPage)).toContainText('Contract Interaction')
  })

  test('refetches balances when account changes', async ({ page, graphql }) => {
    // Get the first account address from the page
    type Account = { address: string; shortenedAddress: string }
    const accountA: Account = { address: HAYDEN_ADDRESS, shortenedAddress: HAYDEN_ADDRESS.slice(0, 6) }
    const accountB: Account = { address: TEST_WALLET_ADDRESS, shortenedAddress: TEST_WALLET_ADDRESS.slice(0, 6) }

    // Open account drawer
    await page.getByTestId(TestID.Web3StatusConnected).click()

    // Verify first account address
    await expect(page.getByTestId(TestID.AddressDisplayCopyHelper)).toContainText(accountA.shortenedAddress)

    // Get initial balance
    const initialBalance = await page.getByTestId(TestID.MiniPortfolioTotalBalance).textContent()

    // Set up mock data for second account
    await graphql.intercept('PortfolioBalances', Mocks.PortfolioBalances.test_wallet)
    // connects to accountB by default
    await page.goto(`/swap`)

    const newBalance = await page.getByTestId(TestID.MiniPortfolioTotalBalance).textContent()

    // Verify new account address
    await expect(page.getByTestId(TestID.AddressDisplayCopyHelper)).toContainText(accountB.shortenedAddress)
    expect(newBalance).not.toBe(initialBalance)
  })
})
