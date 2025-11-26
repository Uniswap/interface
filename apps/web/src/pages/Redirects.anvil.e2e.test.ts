import { expect, getTest } from 'playwright/fixtures'

const test = getTest({ withAnvil: true })

test.describe(
  'Redirects',
  {
    tag: '@team:apps-infra',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-infra' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // Note: requires anvil because the RemoveLiquidityV2WithTokenRedirects component uses the useV2Pair hook,
    // which reads chain state via wagmi hooks
    test('should redirect remove v2 liquidity to positions page', async ({ page }) => {
      await page.goto(
        '/remove/v2/1-0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
      )
      await expect(page).toHaveURL(/\/positions\/v2\/ethereum\/0xBb2b8038a1640196FbE3e38816F3e67Cba72D940/)
    })
  },
)
