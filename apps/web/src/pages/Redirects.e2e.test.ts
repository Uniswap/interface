import { expect, getTest } from 'playwright/fixtures'

const test = getTest()

test.describe('Redirects', () => {
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
    await page.goto('/add/v2/0x318400242bFdE3B20F49237a9490b8eBB6bdB761/ETH')
    await expect(page).toHaveURL(
      /\/positions\/create\/v2\?currencyA=0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=ETH/,
    )
  })

  test('should redirect add v3 liquidity to positions create page', async ({ page }) => {
    await page.goto('/add/0x318400242bFdE3B20F49237a9490b8eBB6bdB761/ETH')
    await expect(page).toHaveURL(
      /\/positions\/create\/v3\?currencyA=0x318400242bFdE3B20F49237a9490b8eBB6bdB761&currencyB=ETH/,
    )
  })

  test('should redirect remove v2 liquidity to positions page', async ({ page }) => {
    await page.goto(
      '/remove/v2/1-0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599/1-0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    )
    await expect(page).toHaveURL(/\/positions\/v2\/ethereum\/0xBb2b8038a1640196FbE3e38816F3e67Cba72D940/)
  })

  test('should redirect remove v3 liquidity to positions page', async ({ page }) => {
    await page.goto('/remove/825708')
    await expect(page).toHaveURL(/\/positions\/v3\/ethereum\/825708/)
  })
})
