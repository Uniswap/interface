import { listLaunches, listLaunchpads } from '@uniswap/client-data-api/dist/data/v2/api-DataApiService_connectquery'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

// The 6 mocked launches render twice: once in the Trending carousel (top by volume, unfiltered)
// and once in the All-launches grid (which the launchpad filter narrows).
const MOCK_LAUNCH_COUNT = 6
const MOCK_CLANKER_COUNT = 2

test.describe(
  'Launches page',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.beforeEach(async ({ page, dataApi }) => {
      await dataApi.intercept(listLaunches, Mocks.DataApiService.list_launches)
      await dataApi.intercept(listLaunchpads, Mocks.DataApiService.list_launchpads)
      await page.goto('/launches')
    })

    test('renders a launch card per launch with its source launchpad badge', async ({ page }) => {
      const cards = page.getByTestId(TestID.LaunchCard)
      await expect(cards).toHaveCount(MOCK_LAUNCH_COUNT * 2)
      // Source badges resolve through the ListLaunchpads registry
      await expect(cards.filter({ hasText: 'clank.fun' })).toHaveCount(2)
      await expect(cards.filter({ hasText: 'Noxa' })).toHaveCount(2)
      await expect(cards.filter({ hasText: 'Flaunch' })).toHaveCount(2)
    })

    test('filters the grid by launchpad from the registry multiselect', async ({ page }) => {
      await expect(page.getByTestId(TestID.LaunchCard)).toHaveCount(MOCK_LAUNCH_COUNT * 2)

      await page.getByTestId(TestID.LaunchpadFilter).click()
      await getVisibleDropdownElementByTestId(page, `${TestID.LaunchpadFilterOptionPrefix}clanker`).click()

      // Trending stays unfiltered; the grid narrows to the clanker launches
      await expect(page.getByTestId(TestID.LaunchCard)).toHaveCount(MOCK_LAUNCH_COUNT + MOCK_CLANKER_COUNT)
    })
  },
)
