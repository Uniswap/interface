import { getRewards } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { FeatureFlags } from '@universe/gating'
import { getUniswapServiceUrls } from '~/config'
import { expect, getTest } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions',
  defaultFeatureFlags: { [FeatureFlags.LpIncentives]: true },
})

function getRewardsUrlPattern(): string {
  return `**/${getRewards.service.typeName}/${getRewards.name}*`
}

test.describe(
  'LP Incentives Rewards',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('rewards card display', () => {
      test('should display rewards card with unclaimed rewards', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        await page.goto(buildUrl({}))

        await expect(page.getByText('5 UNI')).toBeVisible()
        await expect(page.getByText('Rewards earned')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).toBeEnabled()
      })

      test('should not render rewards card when rewards are zero', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards_empty })
        })

        const rewardsResponse = page.waitForResponse((res) =>
          res.url().includes(`${getRewards.service.typeName}/${getRewards.name}`),
        )
        await page.goto(buildUrl({}))
        await rewardsResponse

        // The rewards card only renders when the wallet has unclaimed rewards above
        // the dust threshold, so zero rewards hide it entirely.
        await expect(page.getByText('Rewards earned')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).not.toBeVisible()
      })

      test('should not render rewards card when rewards API fails', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal server error' }) })
        })

        const rewardsResponse = page.waitForResponse((res) =>
          res.url().includes(`${getRewards.service.typeName}/${getRewards.name}`),
        )
        await page.goto(buildUrl({}))
        await rewardsResponse

        // A failed rewards fetch is treated as "no rewards": the card is hidden
        // rather than shown in an error state.
        await expect(page.getByText('Rewards earned')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).not.toBeVisible()
      })
    })

    test.describe('rewards claim modal', () => {
      test('should open claim modal when collect rewards is clicked', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        // Stub the claimRewards liquidity service endpoint to prevent actual claims
        await page.route(`${getUniswapServiceUrls().liquidityServiceUrl}/**ClaimLPRewards*`, async (route) => {
          await route.fulfill({
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ claim: null }),
          })
        })

        await page.goto(buildUrl({}))

        await page.getByRole('button', { name: 'Collect rewards' }).click()

        // Wait for modal to appear
        const modal = page.getByRole('dialog')
        await expect(modal).toBeVisible()

        // Check modal title and content
        await expect(modal.getByText('Collecting rewards')).toBeVisible()
        // The reward amount in the modal starts with "5 UNI" (may or may not have USD value)
        await expect(modal.getByText(/5 UNI/)).toBeVisible()
      })
    })

    test.describe('find eligible pools link', () => {
      test('should navigate to explore pools when clicking find more link', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        await page.goto(buildUrl({}))

        await page.getByText('Find pools with UNI rewards').click()
        await expect(page).toHaveURL(/\/explore\/pools/)
      })
    })

    test.describe('feature flag gating', () => {
      test('should not display rewards card when LP incentives feature flag is off', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        const buildUrlNoIncentives = createTestUrlBuilder({
          basePath: '/positions',
          defaultFeatureFlags: { [FeatureFlags.LpIncentives]: false },
        })

        await page.goto(buildUrlNoIncentives({}))

        await expect(page.getByText('Rewards earned')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).not.toBeVisible()
      })
    })
  },
)
