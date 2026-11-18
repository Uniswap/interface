import { CategoriesOrderConfigKey, DynamicConfigs } from '@universe/gating'
import { TestID } from '@universe/test'
import { expect, getTest, type Page, type Request } from '~/playwright/fixtures'

const test = getTest()

const TRENDING_CATEGORY_ID = 'trending'
const STOCKS_CATEGORY_ID = 'stocks'
// The table pages at 100; the Trending shelf asks for 12, so page size tells the two ListTokens calls apart.
const TABLE_PAGE_SIZE = 100

type ListTokensRequestBody = { page?: { pageSize?: number }; filter?: { categoryIds?: string[] } } | null

function isTableRequestForCategory(request: Request, categoryId: string): boolean {
  if (!request.url().includes('ListTokens')) {
    return false
  }
  const body = request.postDataJSON() as ListTokensRequestBody
  return body?.page?.pageSize === TABLE_PAGE_SIZE && (body.filter?.categoryIds ?? []).includes(categoryId)
}

async function waitForTrendingShelfCards(page: Page): Promise<void> {
  await expect(
    page.getByTestId(TestID.ExploreTrendingShelf).getByTestId(TestID.TokenCardCarouselItem).first(),
  ).toBeVisible()
}

test.describe(
  'Explore token categories',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // The live chip order depends on the backend's ListCategories order; pinning Trending first keeps it a visible chip.
    test.use({
      pinnedDynamicConfigs: {
        [DynamicConfigs.TokenCategoriesOrder]: {
          [CategoriesOrderConfigKey.OrderedCategoryIds]: [TRENDING_CATEGORY_ID],
        },
      },
    })

    test('should show the Trending shelf and open the Trending table from View all', async ({ page }) => {
      await page.goto('/explore/tokens')
      await waitForTrendingShelfCards(page)

      await page.getByTestId(TestID.ExploreTrendingShelf).getByText('View all').click()

      await expect(page).toHaveURL(new RegExp(`/explore/tokens\\?category=${TRENDING_CATEGORY_ID}`))
      await expect(page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${TRENDING_CATEGORY_ID}`)).toBeVisible()
    })

    test('should filter the token table when a category chip is selected', async ({ page }) => {
      await page.goto('/explore/tokens')
      // The shelf's own Trending request settles first, so the next one is the table's.
      await waitForTrendingShelfCards(page)

      const tableRequest = page.waitForRequest((request) => isTableRequestForCategory(request, TRENDING_CATEGORY_ID))
      await page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${TRENDING_CATEGORY_ID}`).click()
      await tableRequest

      await expect(page).toHaveURL(new RegExp(`category=${TRENDING_CATEGORY_ID}`))
      await expect(page.getByTestId(TestID.TokenName).first()).toBeVisible()
    })

    test('should select a category from the More dropdown', async ({ page }) => {
      await page.goto('/explore/tokens')
      await page.getByTestId(TestID.ExploreMoreCategoriesButton).click()

      const dropdown = page.getByTestId(TestID.ExploreMoreCategoriesDropdown)
      const row = dropdown
        .locator(`[data-testid^="${TestID.ExploreCategoryRowPrefix}"]`)
        .and(page.locator(`:not([data-testid="${TestID.ExploreCategoryRowPrefix}${TRENDING_CATEGORY_ID}"])`))
        .first()
      const rowTestId = await row.getAttribute('data-testid')
      const categoryId = rowTestId?.slice(TestID.ExploreCategoryRowPrefix.length)
      expect(categoryId).toBeTruthy()

      await row.click()

      await expect(dropdown).not.toBeVisible()
      await expect(page).toHaveURL(new RegExp(`category=${categoryId}`))
      await expect(page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${categoryId}`)).toBeVisible()
    })

    test('should load a category deep link, including the legacy stocks link', async ({ page }) => {
      const trendingRequest = page.waitForRequest((request) => isTableRequestForCategory(request, TRENDING_CATEGORY_ID))
      await page.goto(`/explore/tokens?category=${TRENDING_CATEGORY_ID}`)
      await trendingRequest
      await expect(page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${TRENDING_CATEGORY_ID}`)).toBeVisible()
      await expect(page.getByTestId(TestID.TokenName).first()).toBeVisible()

      // Stocks renders the grouped RWA table, which is backed by ListTokenGroups rather than ListTokens.
      const stocksRequest = page.waitForRequest((request) => request.url().includes('ListTokenGroups'))
      await page.goto(`/explore/tokens?category=${STOCKS_CATEGORY_ID}`)
      await stocksRequest
      await expect(page).toHaveURL(new RegExp(`category=${STOCKS_CATEGORY_ID}`))
      await expect(page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${STOCKS_CATEGORY_ID}`)).toBeVisible()
    })
  },
)
