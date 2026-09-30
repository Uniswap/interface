import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { TestID } from '@universe/test'
import { expect, getTest } from '~/playwright/fixtures'
import { stubGetPositionFields, stubLiquidityServiceEndpoint } from '~/playwright/fixtures/liquidityService'

const test = getTest()

// A live, funded mainnet V3 position (WETH/USDT 0.3%, actively managed around spot). The migrate
// service reads the source position from live mainnet, so a fully-withdrawn one fails the calldata
// build before the flow ever reaches review — which is what the previous id did once its liquidity
// was pulled. Same id as the anvil migrate spec; refresh both if it is ever withdrawn.
const LIVE_V3_TOKEN_ID = 1362704

test.describe(
  'Migrate V3',
  {
    tag: '@team:apps-lp',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-lp' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  () => {
    test.describe('error handling', () => {
      test('should gracefully handle errors during review', async ({ page }) => {
        // The live read reports the position's real owner, and the page sends anyone else back to
        // /positions before the flow renders.
        await stubGetPositionFields({ page })
        // Simulation runs against live mainnet, where the test wallet holds nothing; without it the
        // calldata build fails at quote time and Continue never enables.
        await stubLiquidityServiceEndpoint({
          page,
          endpoint: LiquidityService.methods.migrateV3ToV4LPPosition,
        })
        await page.goto(`/migrate/v3/ethereum/${LIVE_V3_TOKEN_ID}`)
        await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
        await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
        // No chain behind the mock connector in this suite, so the review fails at its first wallet
        // step and the error surfaces in the modal.
        await page.getByRole('button', { name: 'Migrate' }).click()
        await expect(page.getByText('Something went wrong')).toBeVisible()
        await expect(page.getByText('There was an error fetching data required for your transaction.')).toBeVisible()
        await page.getByTestId(TestID.LiquidityModalHeaderClose).click()
        await page.getByRole('button', { name: 'Continue', disabled: false }).first().click()
        await expect(page.getByText('Something went wrong')).not.toBeVisible()
      })
    })
  },
)
