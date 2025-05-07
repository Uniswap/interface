import { expect, test } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

// Note: only run critical tests in this file
// this file will block merging PRs if it fails
// More comprehensive tests should be located in web/src/pages/**.e2e.test.ts

test('should load swap page', async ({ page }) => {
  await page.goto('/swap')
  await expect(page.getByTestId(TestID.ChooseInputToken)).toBeVisible()
})
