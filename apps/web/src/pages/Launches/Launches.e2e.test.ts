import fs from 'fs'
import { listLaunches, listLaunchpads } from '@uniswap/client-launches/dist/launches/v1/api-LaunchService_connectquery'
import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'
import { getVisibleDropdownElementByTestId } from '~/playwright/fixtures/utils'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const LIST_LAUNCHES_MOCK = JSON.parse(fs.readFileSync(Mocks.DataApiService.list_launches, 'utf-8')) as {
  launches: { launchpadId: string }[]
}

// Derived from the fixture so a fixture edit shifts the expectations instead of masquerading as a
// page bug. Every mocked launch renders as a table row; the trending carousel shows the same
// launches but clones its cards while the marquee loop is active, so trending assertions avoid
// exact counts.
const MOCK_LAUNCH_COUNT = LIST_LAUNCHES_MOCK.launches.length
const MOCK_CLANKER_COUNT = countByLaunchpad('clanker')

/**
 * Expected row count for one launchpad, derived from the fixture like MOCK_LAUNCH_COUNT.
 * Throws at 0 — `toHaveCount(0)` would pass even if launchpad labels stopped rendering, so a
 * fixture edit that drops a launchpad's last launch must fail loudly here, not go vacuous.
 */
function countByLaunchpad(launchpadId: string): number {
  const count = LIST_LAUNCHES_MOCK.launches.filter((launch) => launch.launchpadId === launchpadId).length
  if (count === 0) {
    throw new Error(`list_launches fixture has no '${launchpadId}' launches; add one or drop the assertion`)
  }
  return count
}

/**
 * launchpadIds from a Connect RPC ListLaunches request (GET `message` param or POST body).
 * `searchParams.get` already percent-decodes, so no extra decode. Throws on a malformed body —
 * the route handler answers it with an explicit 500 so the failure is attributable in the trace
 * instead of falling through to the unfiltered mock as a row-count mismatch.
 */
function parseRequestedLaunchpadIds(request: { url(): string; postData(): string | null }): string[] {
  const message = new URL(request.url()).searchParams.get('message')
  const body = JSON.parse(message ?? request.postData() ?? 'null') as { launchpadIds?: unknown } | null
  return Array.isArray(body?.launchpadIds) ? (body.launchpadIds as string[]) : []
}

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

    test('renders the trending carousel and a table row per launch with its launchpad', async ({ page }) => {
      await expect(page.getByTestId(TestID.TrendingLaunchCard).first()).toBeVisible()

      const rows = page.getByTestId(TestID.LaunchTableRow)
      await expect(rows).toHaveCount(MOCK_LAUNCH_COUNT)
      // Launchpad labels resolve through the ListLaunchpads registry. Exact-text match on the
      // launchpad cell's label element so a token name/symbol merely containing the launchpad
      // string can't satisfy the assertion (hasText would substring-match the whole row).
      await expect(rows.filter({ has: page.getByText('Clanker', { exact: true }) })).toHaveCount(MOCK_CLANKER_COUNT)
      await expect(rows.filter({ has: page.getByText('Noxa', { exact: true }) })).toHaveCount(countByLaunchpad('noxa'))
      await expect(rows.filter({ has: page.getByText('Flaunch', { exact: true }) })).toHaveCount(
        countByLaunchpad('flaunch'),
      )
    })

    test('narrows the table by launchpad from the registry multiselect', async ({ page }) => {
      await expect(page.getByTestId(TestID.LaunchTableRow)).toHaveCount(MOCK_LAUNCH_COUNT)

      // Launchpad filtering is server-side (toLaunchesRequestParams), so serve the narrowed feed
      // for requests carrying launchpadIds. Registered after the beforeEach intercept, so it wins.
      await page.route(`**/${listLaunches.service.typeName}/${listLaunches.name}`, async (route) => {
        let launchpadIds: string[]
        try {
          launchpadIds = parseRequestedLaunchpadIds(route.request())
        } catch (error) {
          // A malformed request body is a test bug — answer 500 so the trace points here rather
          // than at a downstream row-count timeout against the unfiltered mock.
          await route.fulfill({
            status: 500,
            contentType: 'application/json',
            body: JSON.stringify({ error: `ListLaunches mock could not parse the request: ${String(error)}` }),
          })
          return
        }
        // Group ids (the hero feed requests `pools`) are expanded into member launchpads by the
        // real server; the fixture only carries concrete launchpad ids. Narrow only when the
        // request names at least one of those — group-id requests get the full feed instead of
        // being starved to an empty response.
        const concreteIds = launchpadIds.filter((id) =>
          LIST_LAUNCHES_MOCK.launches.some((launch) => launch.launchpadId === id),
        )
        if (concreteIds.length === 0) {
          await route.fulfill({ path: Mocks.DataApiService.list_launches })
          return
        }
        await route.fulfill({
          contentType: 'application/json',
          body: JSON.stringify({
            ...LIST_LAUNCHES_MOCK,
            launches: LIST_LAUNCHES_MOCK.launches.filter((launch) => concreteIds.includes(launch.launchpadId)),
          }),
        })
      })

      await page.getByTestId(TestID.LaunchpadFilter).click()
      await getVisibleDropdownElementByTestId(page, `${TestID.LaunchpadFilterOptionPrefix}clanker`).click()

      // Trending stays unfiltered; the table narrows to the clanker launches
      await expect(page.getByTestId(TestID.LaunchTableRow)).toHaveCount(MOCK_CLANKER_COUNT)
      await expect(page.getByTestId(TestID.TrendingLaunchCard).first()).toBeVisible()
    })
  },
)
