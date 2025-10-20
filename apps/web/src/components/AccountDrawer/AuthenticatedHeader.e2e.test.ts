import { expect, getTest } from 'playwright/fixtures'
import { mockUnitagResponse } from 'playwright/fixtures/account'
import { HAYDEN_ADDRESS, TEST_WALLET_ADDRESS } from 'playwright/fixtures/wallets'
import { Page } from 'playwright/test'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { shortenAddress } from 'utilities/src/addresses'

const test = getTest()

test.describe('AuthenticatedHeader unitag and ENS display', () => {
  // Test cases:
  // 1. Shows address if no Unitag or ENS exists
  // 2. Shows Unitag, followed by address, if Unitag exists but not ENS
  // 3. Shows ENS, followed by address, if ENS exists but not Unitag
  // 4. Shows Unitag, followed by address, if user has both Unitag and ENS

  const ACCOUNT_WITH_ENS = HAYDEN_ADDRESS
  const ACCOUNT_WITH_NO_USERNAME = '0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb'
  const HAYDEN_ENS = 'hayden.eth'
  const UNITAG_NAME = 'hayden'

  /**
   * Opens the account drawer and verifies the expected content
   * @param page The Playwright page
   * @param expectedPrimaryText The primary text to verify (unitag or ENS name)
   * @param walletAddress The wallet address to verify in shortened form
   */
  async function openAccountDrawerAndVerify({
    page,
    expectedPrimaryText,
    walletAddress,
  }: {
    page: Page
    expectedPrimaryText?: string
    walletAddress?: string
  }) {
    await page.getByTestId(TestID.Web3StatusConnected).click()

    if (expectedPrimaryText) {
      await expect(
        page.getByTestId(TestID.AddressDisplay).getByText(expectedPrimaryText, { exact: true }),
      ).toBeVisible()
    }

    if (walletAddress) {
      const shortenedAddress = shortenAddress({ address: walletAddress })
      if (expectedPrimaryText) {
        await expect(page.getByTestId(TestID.AddressDisplayCopyHelper)).toContainText(shortenedAddress)
      } else {
        await expect(page.getByTestId(TestID.AddressDisplay)).toContainText(shortenedAddress)
      }
    }
  }

  test('shows address if no Unitag or ENS exists', async ({ page }) => {
    await page.goto(`/swap?eagerlyConnectAddress=${ACCOUNT_WITH_NO_USERNAME}`)
    await openAccountDrawerAndVerify({ page, walletAddress: ACCOUNT_WITH_NO_USERNAME })
  })

  test('shows Unitag, followed by address when Unitag exists but not ENS', async ({ page }) => {
    await mockUnitagResponse({ page, address: TEST_WALLET_ADDRESS, unitag: UNITAG_NAME })
    await page.goto('/swap')

    await openAccountDrawerAndVerify({ page, expectedPrimaryText: UNITAG_NAME, walletAddress: TEST_WALLET_ADDRESS })
  })

  test('shows ENS, followed by address when ENS exists but not Unitag', async ({ page }) => {
    await page.goto(`/swap?eagerlyConnectAddress=${ACCOUNT_WITH_ENS}`)

    await openAccountDrawerAndVerify({ page, expectedPrimaryText: HAYDEN_ENS, walletAddress: ACCOUNT_WITH_ENS })
  })

  test('shows Unitag when user has both Unitag and ENS', async ({ page }) => {
    await mockUnitagResponse({ page, address: ACCOUNT_WITH_ENS, unitag: UNITAG_NAME })
    await page.goto(`/swap?eagerlyConnectAddress=${ACCOUNT_WITH_ENS}`)

    await openAccountDrawerAndVerify({ page, expectedPrimaryText: UNITAG_NAME, walletAddress: ACCOUNT_WITH_ENS })
  })
})
