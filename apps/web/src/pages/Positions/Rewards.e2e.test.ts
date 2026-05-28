import { getRewards } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { FeatureFlags } from '@universe/gating'
import { uniswapUrls } from 'uniswap/src/constants/urls'
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

      test('should display rewards card with zero rewards and disabled collect button', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards_empty })
        })

        await page.goto(buildUrl({}))

        await expect(page.getByText('Rewards earned')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).toBeDisabled()
      })

      test('should show error state when rewards API fails', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal server error' }) })
        })

        await page.goto(buildUrl({}))

        await expect(page.getByText('Your rewards are unavailable right now')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect rewards' })).toBeDisabled()
      })
    })

    test.describe('rewards claim modal', () => {
      test('should open claim modal when collect rewards is clicked', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        // Stub the claimRewards liquidity service endpoint to prevent actual claims
        await page.route(`${uniswapUrls.liquidityServiceUrl}/**ClaimLPRewards*`, async (route) => {
          await route.fulfill({
            status: 200,
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ claim: null }),
          })
        })

        await page.goto(buildUrl({}))

        await page.getByRole('button', { name: 'Collect rewards' }).click()
        await expect(page.getByText('Collecting rewards')).toBeVisible()
        await expect(page.getByText('5 UNI')).toBeVisible()
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
