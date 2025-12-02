import { expect, getTest } from 'playwright/fixtures'

const test = getTest()

test.describe(
  'Explore',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should redirect to explore page when token is not found', async ({ page }) => {
      await page.goto(`/explore/tokens/ethereum/0x123`)
      await expect(page.getByText('Token not found')).toBeVisible()
    })

    test('should redirect to explore page when pool is not found', async ({ page }) => {
      await page.goto(`/explore/pools/ethereum/0x123`)
      await expect(page.getByText('Pool not found')).toBeVisible()
    })
  },
)
