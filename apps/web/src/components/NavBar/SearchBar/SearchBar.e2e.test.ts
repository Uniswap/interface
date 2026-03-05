import { searchTokens } from '@uniswap/client-search/dist/search/v1/api-searchService_connectquery'
import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UNI } from 'uniswap/src/constants/tokens'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { Mocks } from '~/playwright/mocks/mocks'

async function mockSearchTokensResponse({ page }: { page: Page }) {
  await page.route(`**/${searchTokens.service.typeName}/${searchTokens.name}`, async (route) => {
    await route.fulfill({ path: Mocks.Search.search_token_uni })
  })
}

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
      await mockSearchTokensResponse({ page })
      await page.goto('/')
      await page.getByTestId(TestID.NavSearchIcon).click()
      await page.getByTestId(TestID.ExploreSearchInput).click()
      await page.getByTestId(TestID.ExploreSearchInput).fill('Uniswap')
      await page.getByRole('button', { name: 'Uniswap UNI 0x1f98...F984' }).click()
    })

    test('should yield clickable result that is then added to recent searches', async ({ page }) => {
      const url = page.url()
      expect(url).toContain(`/explore/tokens/ethereum/${UNI[1].address}`)
    })

    test('should go to the selected result when recent results are shown', async ({ page }) => {
      await page.getByTestId(TestID.NavSearchIcon).click()
      await expect(page.getByTestId(`section-header-${OnchainItemSectionName.RecentSearches}`)).toBeVisible()
      await expect(page.getByRole('button', { name: 'Uniswap UNI 0x1f98...F984' })).toBeVisible()
    })

    test('should clear recent searches when the clear button is clicked', async ({ page }) => {
      await page.getByTestId(TestID.NavSearchIcon).click()
      await page.getByRole('button', { name: 'Clear' }).click()
      await expect(page.getByTestId(`section-header-${OnchainItemSectionName.RecentSearches}`)).not.toBeVisible()
    })
  },
)
