import { listCategories } from '@uniswap/client-data-api/dist/data/v2/api-DataApiService_connectquery'
import { search } from '@uniswap/client-data-api/dist/data/v2/search-SearchService_connectquery'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { MY_TOKENS_CHIP_ID } from 'uniswap/src/components/TokenSelector/categoryFilters/categoryFilterChips'
import { expect, getTest } from '~/playwright/fixtures'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const SEARCH_QUERY = 'usd'
// The search mock returns USDC (stablecoins, held in the default portfolio mock) and UNI (defi, not held).
const USDC_OPTION = `token-option-${UniverseChainId.Mainnet}-USDC`
const UNI_OPTION = `token-option-${UniverseChainId.Mainnet}-UNI`
const STABLECOINS_CHIP = `${TestID.TokenSelectorCategoryFilterChipPrefix}stablecoins`
const DEFI_CHIP = `${TestID.TokenSelectorCategoryFilterChipPrefix}defi`
const MY_TOKENS_CHIP = `${TestID.TokenSelectorCategoryFilterChipPrefix}${MY_TOKENS_CHIP_ID}`

test.describe(
  'Token selector category filters',
  {
    tag: '@team:apps-portfolio',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-portfolio' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    // Chips come from the categories on the search results, so both are mocked to keep the chip set fixed.
    test.beforeEach(async ({ page, dataApi }) => {
      await dataApi.intercept(listCategories, Mocks.DataApiService.list_categories_token_selector)
      await page.route(`**/${search.service.typeName}/${search.name}`, async (route) => {
        await route.fulfill({ path: Mocks.Search.search_tokens_with_categories })
      })

      await page.goto('/swap')
      await page.getByTestId(TestID.ChooseOutputToken).click()
      await page.getByTestId(TestID.ExploreSearchInput).fill(SEARCH_QUERY)

      await expect(page.getByTestId(TestID.TokenSelectorCategoryFilterChipRow)).toBeVisible()
      await expect(page.getByTestId(USDC_OPTION).first()).toBeVisible()
      await expect(page.getByTestId(UNI_OPTION).first()).toBeVisible()
    })

    test('should narrow the search results to the selected category chips', async ({ page }) => {
      await expect(page.getByTestId(MY_TOKENS_CHIP)).toBeVisible()
      await expect(page.getByTestId(STABLECOINS_CHIP)).toBeVisible()

      await page.getByTestId(DEFI_CHIP).click()
      await expect(page.getByTestId(UNI_OPTION).first()).toBeVisible()
      await expect(page.getByTestId(USDC_OPTION)).toHaveCount(0)

      // Category chips OR together.
      await page.getByTestId(STABLECOINS_CHIP).click()
      await expect(page.getByTestId(UNI_OPTION).first()).toBeVisible()
      await expect(page.getByTestId(USDC_OPTION).first()).toBeVisible()
    })

    test('should clear the filters from the empty state and keep the search text', async ({ page }) => {
      // My tokens ANDs with the category chips, and the only held result is not in DeFi.
      await page.getByTestId(MY_TOKENS_CHIP).click()
      await page.getByTestId(DEFI_CHIP).click()

      const clearFilters = page.getByTestId(TestID.TokenSelectorClearCategoryFilters)
      await expect(clearFilters).toBeVisible()
      await expect(page.getByTestId(USDC_OPTION)).toHaveCount(0)
      await expect(page.getByTestId(UNI_OPTION)).toHaveCount(0)

      await clearFilters.click()

      await expect(page.getByTestId(TestID.ExploreSearchInput)).toHaveValue(SEARCH_QUERY)
      await expect(page.getByTestId(USDC_OPTION).first()).toBeVisible()
      await expect(page.getByTestId(UNI_OPTION).first()).toBeVisible()
    })
  },
)
