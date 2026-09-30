import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

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
      // The pool exists, so the link skips token selection and opens the pool's own add-liquidity
      // route on the range step, carrying the pair, its dynamic fee and its hook in the URL.
      await expect(page).toHaveURL(
        /\/positions\/add\/unichain\/0x740e789c2c770383feca96b0c38a952531711ef041b6e8300b47f0b2c9e3f3c8\?.*step=1/,
      )
      await expect(page.getByRole('heading', { name: 'Set your position' })).toBeVisible()
      await expect(page.getByTestId(TestID.PoolPairLabel)).toHaveText(/ETH.*USDC/)
      await expect(page.getByText('Dynamic', { exact: true })).toBeVisible()
      // Exact names: recent-activity rows are also role=button and can mention the same symbols.
      await expect(page.getByRole('button', { name: 'ETH', exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'USDC', exact: true })).toBeVisible()
    })
  },
)
