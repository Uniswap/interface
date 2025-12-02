import { expect, getTest } from 'playwright/fixtures'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UNI } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

const test = getTest()

test.describe(
  'Search',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await page.getByTestId(TestID.NavSearchInput).click()
      await page.getByTestId(TestID.ExploreSearchInput).click()
      await page.getByTestId(TestID.ExploreSearchInput).fill('Uniswap')
      await page.getByRole('button', { name: 'Uniswap UNI 0x1f98...F984' }).click()
    })

    test('should yield clickable result that is then added to recent searches', async ({ page }) => {
      const url = page.url()
      expect(url).toContain(`/explore/tokens/ethereum/${UNI[1].address}`)
    })

    test('should go to the selected result when recent results are shown', async ({ page }) => {
      await page.getByTestId(TestID.NavSearchInput).click()
      expect(page.getByTestId(`section-header-${OnchainItemSectionName.RecentSearches}`)).toBeVisible()
      expect(page.getByRole('button', { name: 'Uniswap UNI 0x1f98...F984' })).toBeVisible()
    })

    test('should clear recent searches when the clear button is clicked', async ({ page }) => {
      await page.getByTestId(TestID.NavSearchInput).click()
      await page.getByRole('button', { name: 'Clear' }).click()
      expect(page.getByTestId(`section-header-${OnchainItemSectionName.RecentSearches}`)).not.toBeVisible()
    })
  },
)
