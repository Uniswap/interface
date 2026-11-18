import { DynamicConfigs, TokenCategoriesSearchSpotlightConfigKey } from '@universe/gating'
import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const TRENDING_CATEGORY_ID = 'trending'

test.describe(
  'Search categories',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // The spotlight config defaults to no categories, which leaves the resting state on the legacy shelves.
    test.use({
      pinnedDynamicConfigs: {
        [DynamicConfigs.TokenCategoriesSearchSpotlight]: {
          [TokenCategoriesSearchSpotlightConfigKey.SpotlitCategoryIds]: [TRENDING_CATEGORY_ID],
        },
      },
    })

    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId(TestID.NavSearchIcon).click()
    })

    test('should show the spotlit category section before typing', async ({ page }) => {
      await expect(page.getByTestId(`${TestID.SectionHeaderPrefix}category-${TRENDING_CATEGORY_ID}`)).toBeVisible()
    })

    test('should open the category page from a category result', async ({ page }) => {
      await page.getByTestId(TestID.ExploreSearchInput).fill('Trending')

      await page.getByTestId(`${TestID.SearchCategoryRowPrefix}${TRENDING_CATEGORY_ID}`).click()

      await expect(page).toHaveURL(new RegExp(`/explore/category/${TRENDING_CATEGORY_ID}$`))
      await expect(page.getByTestId(TestID.CategoryDetailsHeader)).toBeVisible()
    })
  },
)
