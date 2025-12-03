import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Pool details',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should display the pool details', async ({ page }) => {
      await page.goto('/explore/pools/unichain/0x740e789c2c770383feca96b0c38a952531711ef041b6e8300b47f0b2c9e3f3c8')
      await expect(page.locator('h1').first()).toHaveText('ETH / USDC')
    })

    test('should link and prefill create position form', async ({ page }) => {
      await page.goto('/explore/pools/unichain/0x740e789c2c770383feca96b0c38a952531711ef041b6e8300b47f0b2c9e3f3c8')
      await page.getByTestId(TestID.PoolDetailsAddLiquidityButton).click()
      await expect(page.getByRole('button', { name: 'USDC' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'ETH' })).toBeVisible()
      await expect(page.getByText('Dynamic fee tier')).toBeVisible()
      await page.getByRole('button', { name: 'Continue' }).click()
      await expect(page.getByText('Adding hook').first()).toBeVisible()
    })
  },
)
