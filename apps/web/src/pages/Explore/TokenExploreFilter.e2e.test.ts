import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

test.describe(
  'Token explore filter',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // Explore search is server-side: the box's value is sent as
    // `filter.searchQuery` (a case-insensitive prefix on name or symbol) and the table shows the
    // served page, so the assertions are on the request and the served rows — not on a client-side
    // subset of the rows that were loaded before typing.
    test('should search tokens through the backend', async ({ page }) => {
      const searchTerm = 'dai'
      await page.goto('/explore/tokens')
      await expect(page.getByTestId(TestID.TokenName).first()).toBeVisible()

      const searchedRequest = page.waitForRequest((request) => {
        if (!request.url().includes('ListTokens')) {
          return false
        }
        const body = request.postDataJSON() as { filter?: { searchQuery?: string } } | null
        return body?.filter?.searchQuery === searchTerm
      })
      await page.getByTestId(TestID.ExploreTokensSearchInput).click()
      await page.getByTestId(TestID.ExploreTokensSearchInput).fill(searchTerm)
      await searchedRequest

      await expect(page.getByTestId(TestID.TokenName).first()).toContainText(searchTerm, { ignoreCase: true })
    })
  },
)
