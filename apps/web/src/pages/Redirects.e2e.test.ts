import { expect, getTest } from 'playwright/fixtures'

const test = getTest()

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
    test('should redirect to /vote/create-proposal when visiting /create-proposal', async ({ page }) => {
      await page.goto('/create-proposal')
      await expect(page).toHaveURL(/\/vote\.uniswapfoundation\.org/)
    })

    test('should redirect to /not-found when visiting nonexist url', async ({ page }) => {
      await page.goto('/none-exist-url')
      await expect(page).toHaveURL(/\/not-found/)
    })

    test('should redirect from /tokens/ to /explore', async ({ page }) => {
      await page.goto('/tokens')
      await expect(page).toHaveURL(/\/explore/)

      await page.goto('/tokens/ethereum')
      await expect(page).toHaveURL(/\/explore\/tokens\/ethereum/)

      await page.goto('/tokens/optimism/NATIVE')
      await expect(page).toHaveURL(/\/explore\/tokens\/optimism\/NATIVE/)
    })

    test('should redirect /pool to /positions', async ({ page }) => {
      await page.goto('/pool')
      await expect(page).toHaveURL(/\/positions/)
    })

    test('should redirect /pool/:tokenId with chain param to /positions/v3/:chainName/:tokenId', async ({ page }) => {
      await page.goto('/pool/123?chain=mainnet')
      await expect(page).toHaveURL(/\/positions\/v3\/ethereum\/123/)
    })

    test('should redirect add v2 liquidity to positions create page', async ({ page }) => {
      await page.goto(
        '/add/v2/1-0x318400242bFdE3B20F49237a9490b8eBB6bdB761/1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      )
      await expect(page).toHaveURL(
        /\/positions\/create\/v2\?currencyA=1-0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/,
      )
    })

    test('should redirect add v3 liquidity to positions create page', async ({ page }) => {
      await page.goto('/add/1-0x318400242bFdE3B20F49237a9490b8eBB6bdB761/1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
      await expect(page).toHaveURL(
        /\/positions\/create\/v3\?currencyA=1-0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48/,
      )
    })

    test('should redirect remove v3 liquidity to positions page', async ({ page }) => {
      await page.goto('/remove/825708')
      await expect(page).toHaveURL(/\/positions\/v3\/ethereum\/825708/)
    })
  },
)
