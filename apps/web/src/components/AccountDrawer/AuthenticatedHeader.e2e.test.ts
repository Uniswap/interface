import { getTest } from 'playwright/fixtures'
import { mockUnitagResponse, openAccountDrawerAndVerify } from 'playwright/fixtures/account'
import { TEST_WALLET_ADDRESS, UNITAG_NAME } from 'playwright/fixtures/wallets'

const test = getTest()

test.describe(
  'AuthenticatedHeader unitag and ENS display',
  {
    tag: '@team:apps-growth',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-growth' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // Test cases:
    // 1. Shows address if no Unitag or ENS exists
    // 2. Shows Unitag, followed by address, if Unitag exists but not ENS

    const ACCOUNT_WITH_NO_USERNAME = '0xF030EaA01aFf57A23483dC8A1c3550d153be69Fb'

    test('shows address if no Unitag or ENS exists', async ({ page }) => {
      await page.goto(`/swap?eagerlyConnectAddress=${ACCOUNT_WITH_NO_USERNAME}`)
      await openAccountDrawerAndVerify({ page, walletAddress: ACCOUNT_WITH_NO_USERNAME })
    })

    test('shows Unitag, followed by address when Unitag exists but not ENS', async ({ page }) => {
      await mockUnitagResponse({ page, address: TEST_WALLET_ADDRESS, unitag: UNITAG_NAME })
      await page.goto('/swap')

      await openAccountDrawerAndVerify({ page, expectedPrimaryText: UNITAG_NAME, walletAddress: TEST_WALLET_ADDRESS })
    })
  },
)
