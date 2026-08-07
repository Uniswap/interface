import { getRewards } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { FeatureFlags } from '@universe/gating'
import { expect, getTest } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions',
  defaultFeatureFlags: {
    [FeatureFlags.LpIncentives]: true,
    [FeatureFlags.MultiTokenLpIncentives]: true,
  },
})

function getRewardsUrlPattern(): string {
  return `**/${getRewards.service.typeName}/${getRewards.name}*`
}

test.describe(
  'Multi-token LP Incentives Rewards',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('rewards card display', () => {
      test('should display the rewards card with a USD total', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        await page.goto(buildUrl({}))

        // The card renders the aggregate USD total and enables Collect only when the wallet
        // has priced reward balances above the dust threshold.
        await expect(page.getByText('Total rewards')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect', exact: true })).toBeEnabled()
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

        await expect(page.getByText('Total rewards')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect', exact: true })).not.toBeVisible()
      })

      test('should not render the rewards card when the API fails for a wallet with no positions', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal server error' }) })
        })

        const rewardsResponse = page.waitForResponse((res) =>
          res.url().includes(`${getRewards.service.typeName}/${getRewards.name}`),
        )
        await page.goto(buildUrl({}))
        await rewardsResponse

        // A failed fetch leaves the balance unknown rather than zero, so the card would otherwise
        // render greyed and uncollectable. That state is for wallets that plausibly have rewards —
        // holding no positions, this one gets nothing, so an outage can't put an uncollectable card
        // in front of every connected wallet.
        await expect(page.getByText('Your rewards are unavailable right now')).not.toBeVisible()
        await expect(page.getByRole('button', { name: 'Collect', exact: true })).not.toBeVisible()
      })
    })

    test.describe('rewards modal', () => {
      test('should open the wallet rewards modal listing collectable rewards when collect is clicked', async ({
        page,
      }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        await page.goto(buildUrl({}))

        // Wait for the card to render before clicking so the button's handler is attached
        // (avoids a first-click-before-hydration race).
        await expect(page.getByRole('button', { name: 'Collect', exact: true })).toBeEnabled()
        await page.getByRole('button', { name: 'Collect', exact: true }).click()

        // Collect opens the wallet-level "Your rewards" modal. The fixture is a single token on a
        // single chain, so the modal uses the single-chain layout: one per-row Collect and no
        // chain header or "Collect all" (that button only appears with 2+ tokens on the chain).
        const modal = page.getByRole('dialog')
        await expect(modal.getByText('Your rewards')).toBeVisible()
        await expect(modal.getByRole('button', { name: 'Collect', exact: true })).toBeVisible()
        await expect(modal.getByRole('button', { name: 'Collect all' })).toHaveCount(0)
        await expect(page.getByText('You have no rewards to collect')).not.toBeVisible()
      })
    })

    test.describe('feature flag gating', () => {
      test('should fall back to the UNI-only card when the multi-token flag is off', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards })
        })

        const buildUrlSingleToken = createTestUrlBuilder({
          basePath: '/positions',
          defaultFeatureFlags: {
            [FeatureFlags.LpIncentives]: true,
            [FeatureFlags.MultiTokenLpIncentives]: false,
          },
        })

        await page.goto(buildUrlSingleToken({}))

        await expect(page.getByText('Rewards earned')).toBeVisible()
        await expect(page.getByText('Total rewards')).not.toBeVisible()
      })
    })
  },
)
