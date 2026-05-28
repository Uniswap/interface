import { getPortfolio } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { UnitagService } from '@universe/api'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'
import { expect, type Page } from '~/playwright/fixtures'
import { Mocks } from '~/playwright/mocks/mocks'

/**
 * Mocks the Unitag API response for a specific address
 */
export async function mockUnitagResponse({
  page,
  address,
  unitag,
}: {
  page: Page
  address: string
  unitag: string | null
}) {
  await page.route(`**/${UnitagService.typeName}/${UnitagService.methods.getAddress.name}`, async (route) => {
    const postData = route.request().postData()
    try {
      const requestedAddress = postData ? (JSON.parse(postData) as { address?: string }).address : undefined

      // oxlint-disable-next-line universe-custom/no-tolowercase-address-currencyid
      if (!requestedAddress || requestedAddress.toLowerCase() !== address.toLowerCase()) {
        await route.continue()
        return
      }
    } catch {
      await route.continue()
      return
    }

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        ...(unitag ? { username: unitag } : {}),
        address,
      }),
    })
  })
}

/**
 * Mocks the GetPortfolio API response
 * @param page The Playwright page
 * @param mockPath Optional path to mock JSON (default: get_portfolio with tokens)
 */
export async function mockGetPortfolioResponse({
  page,
  mockPath = Mocks.DataApiService.get_portfolio,
}: {
  page: Page
  mockPath?: string
}) {
  await page.route(`**/${getPortfolio.service.typeName}/${getPortfolio.name}`, async (route) => {
    await route.fulfill({ path: mockPath })
  })
}

/**
 * Opens the account drawer and verifies the expected content
 * @param page The Playwright page
 * @param expectedPrimaryText The primary text to verify (unitag or ENS name)
 * @param walletAddress The wallet address to verify in shortened form
 */
export async function openAccountDrawerAndVerify({
  page,
  expectedPrimaryText,
  walletAddress,
}: {
  page: Page
  expectedPrimaryText?: string
  walletAddress?: string
}) {
  await page.getByTestId(TestID.Web3StatusConnected).click()

  const drawer = page.getByTestId(TestID.AccountDrawer)

  if (expectedPrimaryText) {
    await expect(
      drawer.getByTestId(TestID.AddressDisplay).getByText(expectedPrimaryText, { exact: true }),
    ).toBeVisible()
  }

  if (walletAddress) {
    const shortenedAddress = shortenAddress({ address: walletAddress })
    await expect(drawer.getByText(shortenedAddress)).toBeVisible()
  }
}
