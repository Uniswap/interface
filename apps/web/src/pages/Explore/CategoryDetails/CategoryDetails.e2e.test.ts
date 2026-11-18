import { CategoriesOrderConfigKey, DynamicConfigs } from '@universe/gating'
import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const TRENDING_CATEGORY_ID = 'trending'

test.describe(
  'Category details',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.use({
      pinnedDynamicConfigs: {
        [DynamicConfigs.TokenCategoriesOrder]: {
          [CategoriesOrderConfigKey.OrderedCategoryIds]: [TRENDING_CATEGORY_ID],
        },
      },
    })

    test('should render the header, stats and token table from a deep link', async ({ page }) => {
      await page.goto(`/explore/category/${TRENDING_CATEGORY_ID}`)

      await expect(page).toHaveURL(new RegExp(`/explore/category/${TRENDING_CATEGORY_ID}$`))
      await expect(page.getByTestId(TestID.CategoryDetailsHeader)).toContainText('Trending')
      await expect(page.getByTestId(TestID.CategoryStat).first()).toBeVisible()
      await expect(page.getByTestId(TestID.TokenName).first()).toBeVisible()
    })

    test('should open from the Explore chip hover card and go back through the breadcrumb', async ({ page }) => {
      await page.goto('/explore/tokens')

      await page.getByTestId(`${TestID.ExploreCategoryChipPrefix}${TRENDING_CATEGORY_ID}`).hover()
      await page.getByTestId(TestID.CategoryDefinitionCard).click()

      await expect(page).toHaveURL(new RegExp(`/explore/category/${TRENDING_CATEGORY_ID}$`))
      await expect(page.getByTestId(TestID.CategoryDetailsHeader)).toBeVisible()

      // Entered from Explore rather than a token page, so the breadcrumb leads back to the token list.
      await page.getByLabel('breadcrumb-nav').getByRole('link', { name: 'Tokens' }).click()
      await expect(page).toHaveURL(/\/explore\/tokens$/)
    })
  },
)
