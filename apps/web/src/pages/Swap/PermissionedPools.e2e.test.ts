import type { Page } from '@playwright/test'
import { V1_TRADING_API_PATHS } from '@universe/api'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getTradingApiEndpointPattern } from '~/playwright/fixtures/tradingApi'

const test = getTest()

// E2E scope: regression-only. Positive-path UI (banner copy, CTA text, gated overlays,
// TDP pill row) is exercised at the unit level via PermissionedSwapBanner.test.tsx,
// VerifyIdentityBottomSheet.test.tsx, TDPActionTabs.test.tsx, TokenDescriptionPills.test.tsx,
// and usePermissionedSwap.test.ts. The tests here verify that non-permissioned tokens
// never accidentally surface permissioned UI, with CheckPermissions stubbed for hermeticity.
// The permissioned surfaces that can render on web swap/TDP are the VerifyIdentityModal and
// the Limit/Buy/Sell tab overlay (PermissionedPoolBanner is LP-only on web).
const USDC_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

async function stubCheckPermissionsAsNotPermissioned({ page, tokenAddress }: { page: Page; tokenAddress: string }) {
  await page.route(getTradingApiEndpointPattern(V1_TRADING_API_PATHS.checkPermissions), async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        requestId: 'e2e-stub',
        results: [{ token: tokenAddress.toLowerCase(), isPermissioned: false }],
      }),
      contentType: 'application/json',
    })
  })
}

test.describe(
  'Permissioned Pools',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should NOT show permissioned pool UI for standard tokens on /swap', async ({ page }) => {
      await stubCheckPermissionsAsNotPermissioned({ page, tokenAddress: USDC_ADDRESS })
      await page.goto(`/swap?inputCurrency=ETH&outputCurrency=${USDC_ADDRESS}`)
      await expect(page.getByTestId(TestID.AmountInputIn)).toBeVisible()
      await expect(page.getByTestId(TestID.VerifyIdentityModal)).not.toBeVisible()

      // The Limit tab hosts the permissioned overlay surface; it must stay interactive.
      await page.goto(`/limit?inputCurrency=ETH&outputCurrency=${USDC_ADDRESS}`)
      await expect(page.getByTestId(TestID.AmountInputIn)).toBeVisible()
      await expect(page.getByTestId(TestID.PermissionedPoolTabOverlay)).not.toBeVisible()
    })

    test('should NOT show permissioned pool UI on TDP for non-permissioned token', async ({ page }) => {
      await stubCheckPermissionsAsNotPermissioned({ page, tokenAddress: USDC_ADDRESS })
      await page.goto(`/explore/tokens/ethereum/${USDC_ADDRESS}`)
      await expect(page.getByTestId(TestID.TokenDetailsInfoContainer)).toBeVisible()
      await expect(page.getByTestId(TestID.VerifyIdentityModal)).not.toBeVisible()
    })
  },
)
