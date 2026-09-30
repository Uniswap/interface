import { getRewards } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions',
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
        await expect(page.getByTestId(TestID.PositionsSummaryCollectRewards)).toBeEnabled()
      })

      test('keeps the rewards chip in the summary row when rewards are zero, with Collect disabled', async ({
        page,
      }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ path: Mocks.DataApiService.get_rewards_empty })
        })

        const rewardsResponse = page.waitForResponse((res) =>
          res.url().includes(`${getRewards.service.typeName}/${getRewards.name}`),
        )
        await page.goto(buildUrl({}))
        await rewardsResponse

        // Unlike the standalone rewards card, the summary chips are a persistent row — the rewards
        // chip stays put and de-emphasizes a zero rather than vanishing, so the row doesn't reflow
        // as balances change. Rewards.e2e.test.ts covers the card, which does hide itself.
        await expect(page.getByText('Total rewards')).toBeVisible()
        await expect(page.getByTestId(TestID.PositionsSummaryCollectRewards)).toBeDisabled()
      })

      test('keeps the rewards chip but disables Collect when the rewards API fails', async ({ page }) => {
        await page.route(getRewardsUrlPattern(), async (route) => {
          await route.fulfill({ status: 500, body: JSON.stringify({ error: 'Internal server error' }) })
        })

        const rewardsResponse = page.waitForResponse((res) =>
          res.url().includes(`${getRewards.service.typeName}/${getRewards.name}`),
        )
        await page.goto(buildUrl({}))
        await rewardsResponse

        // A failed fetch leaves the balance unknown rather than zero. The persistent chips row keeps
        // the chip either way, so what an outage must not do is offer a collect it can't honour.
        // The card's own outage behaviour — hiding itself unless the wallet holds positions — is
        // Rewards.e2e.test.ts's; the chip has no equivalent gate, hence no unavailable copy here.
        await expect(page.getByText('Total rewards')).toBeVisible()
        await expect(page.getByTestId(TestID.PositionsSummaryCollectRewards)).toBeDisabled()
        await expect(page.getByText('Your rewards are unavailable right now')).not.toBeVisible()
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
        await expect(page.getByTestId(TestID.PositionsSummaryCollectRewards)).toBeEnabled()
        await page.getByTestId(TestID.PositionsSummaryCollectRewards).click()

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
  },
)
