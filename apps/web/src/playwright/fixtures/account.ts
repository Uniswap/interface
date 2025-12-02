import { expect, type Page } from 'playwright/test'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

import { shortenAddress } from 'utilities/src/addresses'

// eslint-disable-next-line multiline-comment-style
/**
 * Mocks the Unitag API response for a specific address
 * @param page The Playwright page
 * @param address The wallet address to mock unitag data for

 * @param unitag The unitag data to return (null for no unitag)
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
  await page.route(`${uniswapUrls.unitagsApiUrl}/address?address=${address}`, async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        username: unitag,
        address,
      }),
    })
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
