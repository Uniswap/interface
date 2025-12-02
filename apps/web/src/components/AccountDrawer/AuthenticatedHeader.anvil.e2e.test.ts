import { getTest } from 'playwright/fixtures'
import { mockUnitagResponse, openAccountDrawerAndVerify } from 'playwright/fixtures/account'
import { HAYDEN_ADDRESS, HAYDEN_ENS, UNITAG_NAME } from 'playwright/fixtures/wallets'

const test = getTest({ withAnvil: true })

test.describe('AuthenticatedHeader unitag and ENS display', () => {
  // Test cases:
  // 1. Shows ENS, followed by address, if ENS exists but not Unitag
  // 2. Shows Unitag, followed by address, if user has both Unitag and ENS

  const ACCOUNT_WITH_ENS = HAYDEN_ADDRESS

  test('shows ENS, followed by address when ENS exists but not Unitag', async ({ page }) => {
    await page.goto(`/swap?eagerlyConnectAddress=${ACCOUNT_WITH_ENS}`)

    await openAccountDrawerAndVerify({ page, expectedPrimaryText: HAYDEN_ENS, walletAddress: HAYDEN_ADDRESS })
  })

  test('shows Unitag when user has both Unitag and ENS', async ({ page }) => {
    await mockUnitagResponse({ page, address: HAYDEN_ADDRESS, unitag: UNITAG_NAME })
    await page.goto(`/swap?eagerlyConnectAddress=${HAYDEN_ADDRESS}`)

    await openAccountDrawerAndVerify({ page, expectedPrimaryText: UNITAG_NAME, walletAddress: HAYDEN_ADDRESS })
  })
})
