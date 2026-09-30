import { getPosition } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api-LiquidityService_connectquery'
import { TestID } from '@universe/test'
import { expect, getTest, type Page } from '~/playwright/fixtures'
import { createTestUrlBuilder } from '~/playwright/fixtures/urls'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest()

const buildUrl = createTestUrlBuilder({
  basePath: '/positions/v4/ethereum/13281',
})

// The position detail read is served by the liquidity-service GetPosition RPC; the reward balances
// (and per-token fee USD) ride that response. Globbed rather than built from a base URL: connect-query
// appends its own query string, which an exact-URL route would not match.
const POSITION_URL_PATTERN = `**/${getPosition.service.typeName}/${getPosition.name}*`

// The mocked position earns four reward denominations — UNI, USDC and LDO priced, LUSD unpriced —
// served in the liquidity-service Position's `rewards` list.
async function loadPosition(page: Page): Promise<void> {
  await page.route(POSITION_URL_PATTERN, async (route) => {
    await route.fulfill({ path: Mocks.LiquidityService.get_v4_position_multi_token_rewards })
  })

  await page.goto(buildUrl({}))
  // The earnings card only renders once the position resolves, so waiting on it covers the fetch.
  // Longer than the default: which rewards render is flag-gated, and a Statsig init that has to
  // retry pushes first paint of the card past 5s.
  await expect(page.getByTestId(TestID.PositionEarningsSection)).toBeVisible({ timeout: 20_000 })
}

test.describe(
  'Position earnings rewards',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test('should show one earnings row per reward token, denominated in that token', async ({ page }) => {
      await loadPosition(page)

      await expect(page.getByText('Rewards', { exact: true })).toBeVisible()

      // Amount and identity both come from the balance, so each row is in its own token's units
      // and decimals (UNI 18, USDC 6, LDO 18, LUSD 18).
      await expect(page.getByText('12.40 UNI')).toBeVisible()
      await expect(page.getByText('64.82 USDC')).toBeVisible()
      await expect(page.getByText('18.90 LDO')).toBeVisible()
      await expect(page.getByText('3.12 LUSD')).toBeVisible()

      // USD comes from the balance's backend price rather than a client-side quote.
      await expect(page.getByText('$113.21')).toBeVisible()
      await expect(page.getByText('$64.82')).toBeVisible()
      await expect(page.getByText('$27.05')).toBeVisible()
    })

    test('should give each priced reward token its own earnings bar segment', async ({ page }) => {
      await loadPosition(page)

      // Scoped to the earnings section: the position's own token breakdown above it draws a stacked
      // bar of its own, so an unscoped count would pick up those segments too.
      const earnings = page.getByTestId(TestID.PositionEarningsSection)
      await expect(earnings.getByText('Rewards', { exact: true })).toBeVisible()

      // Two fee segments plus one per priced reward. The unpriced LUSD reward has no share of the
      // USD total to draw, so it keeps its row above but adds no segment.
      await expect(earnings.getByTestId(TestID.LiquidityPositionStackedBarSegment)).toHaveCount(5)
    })

    test('should keep the earnings bar within the card as segments accumulate', async ({ page }) => {
      await loadPosition(page)

      const earnings = page.getByTestId(TestID.PositionEarningsSection)
      await expect(earnings.getByTestId(TestID.LiquidityPositionStackedBarSegment)).toHaveCount(5)

      // The segment count follows the number of reward tokens, so neither row can be sized for a
      // fixed count: the slices grow into the width left over after their gaps, and the legend
      // wraps. Five segments overflowed both before that.
      const overflow = await earnings.evaluate((section) => {
        const legend = section.querySelector<HTMLElement>(
          '[data-testid="liquidity-position-stacked-bar-segment"]',
        )?.parentElement
        const slices = legend?.parentElement?.firstElementChild as HTMLElement | undefined
        const overflowOf = (el?: HTMLElement | null) => (el ? el.scrollWidth - el.clientWidth : -1)
        return { legend: overflowOf(legend), slices: overflowOf(slices), card: overflowOf(section as HTMLElement) }
      })

      expect(overflow).toEqual({ legend: 0, slices: 0, card: 0 })
    })

    test('should read the UNI reward from its balance, not a stray scalar', async ({ page }) => {
      await loadPosition(page)

      // Rewards are read from the per-token balances alone, so the UNI row names the 12.4 UNI balance
      // and no other UNI amount (e.g. a retired legacy scalar) leaks in.
      await expect(page.getByText('12.40 UNI')).toBeVisible()
      await expect(page.getByText('5.00 UNI')).not.toBeVisible()
    })
  },
)
