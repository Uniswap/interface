import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'

test.describe(
  'Token details',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // There are 2 h1 tags: one in BreadcrumbNav (for SEO) and one in TokenDetailsHeader (token name)
    // This test ensures no additional h1 tags are accidentally added (e.g., from Swap tabs)
    test('should have exactly 2 h1 tags on smaller screen size', async ({ page }) => {
      await page.setViewportSize({ width: 800, height: 600 })
      await page.goto(`/explore/tokens/ethereum/${UNI_ADDRESS}`)
      // Wait for the page to fully load
      await expect(page.getByTestId(TestID.TokenDetailsInfoContainer)).toBeVisible()
      await expect(page.locator('h1')).toHaveCount(2)
    })
  },
)
