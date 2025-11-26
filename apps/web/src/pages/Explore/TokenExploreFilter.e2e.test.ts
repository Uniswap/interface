import { expect, getTest } from 'playwright/fixtures'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

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
    test('should filter correctly by search term', async ({ page }) => {
      await page.goto('/explore/tokens')
      const searchTerm = 'dai'
      const tokenNamesBeforeFilter = await page.getByTestId(TestID.TokenName).allTextContents()
      const matchingTokensBeforeFilter = tokenNamesBeforeFilter.filter((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      await page.getByTestId(TestID.ExploreTokensSearchInput).click()
      await page.getByTestId(TestID.ExploreTokensSearchInput).fill(searchTerm)
      await page.getByTestId(TestID.ExploreTokensSearchInput).press('Enter')

      await page.waitForTimeout(500)

      const firstTokenAfterFilter = await page.getByTestId(TestID.TokenName).first().textContent()

      expect(firstTokenAfterFilter?.toLowerCase()).toContain(searchTerm.toLowerCase())

      if (matchingTokensBeforeFilter.length > 0 && firstTokenAfterFilter) {
        const foundInOriginalMatches = matchingTokensBeforeFilter.some((token) =>
          token.toLowerCase().includes(firstTokenAfterFilter.toLowerCase()),
        )
        expect(foundInOriginalMatches).toBeTruthy()
      }
    })
  },
)
