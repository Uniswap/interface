import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'

const test = getTest()

const ETH_TDP_PATH = '/explore/tokens/ethereum/NATIVE'
const MAJORS_CATEGORY_ID = 'majors'

test.describe(
  'Token details categories',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should open the category page from a header chip and come back through the breadcrumb', async ({ page }) => {
      await page.goto(ETH_TDP_PATH)

      await page.getByTestId(`${TestID.TokenDetailsCategoryChipPrefix}${MAJORS_CATEGORY_ID}`).click()

      await expect(page).toHaveURL(new RegExp(`/explore/category/${MAJORS_CATEGORY_ID}$`))
      await expect(page.getByTestId(TestID.CategoryDetailsHeader)).toBeVisible()

      await page.getByLabel('breadcrumb-nav').getByRole('link', { name: 'ETH' }).click()
      await expect(page).toHaveURL(new RegExp(`${ETH_TDP_PATH}$`))
    })

    test('should show related token cards for the token category', async ({ page }) => {
      const relatedTokensRequest = page.waitForRequest((request) => {
        if (!request.url().includes('ListTokens')) {
          return false
        }
        const body = request.postDataJSON() as { filter?: { categoryIds?: string[] } } | null
        return (body?.filter?.categoryIds ?? []).includes(MAJORS_CATEGORY_ID)
      })
      await page.goto(ETH_TDP_PATH)
      await relatedTokensRequest

      const relatedTokens = page.getByTestId(TestID.TokenDetailsRelatedTokens)
      await relatedTokens.scrollIntoViewIfNeeded()
      await expect(relatedTokens.getByTestId(TestID.TokenCardCarouselItem).first()).toBeVisible()
    })
  },
)
