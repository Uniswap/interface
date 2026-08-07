import { listTransactions } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { WETH9 } from '@uniswap/sdk-core'
import { TRADING_API_PATHS, V1_TRADING_API_PATHS } from '@universe/api'
import { ZERO_ADDRESS } from 'uniswap/src/constants/misc'
import { DAI, USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { parseEther } from '~/chains'
import { assume0xAddress } from '~/chains'
import { getUniswapServiceUrls } from '~/config'
import { expect, getTest } from '~/playwright/fixtures'
import { getTradingApiEndpointPattern } from '~/playwright/fixtures/tradingApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'
import { Mocks } from '~/playwright/mocks/mocks'

const test = getTest({ withAnvil: true })

const UNISWAP_X_ORDERS_ENDPOINT = `https://interface.gateway.uniswap.org/v2/orders?swapper=${TEST_WALLET_ADDRESS}&orderHashes=${ZERO_ADDRESS}`

test.describe(
  'UniswapX',
  {
    tag: '@team:apps-swap',
    annotation: [
      { type: 'DD_TAGS[team]', description: 'apps-swap' },
      { type: 'DD_TAGS[test.type]', description: 'web-e2e' },
    ],
  },
  async () => {
    test.beforeEach(async ({ page, anvil }) => {
      await anvil.setErc20Balance({
        address: assume0xAddress(WETH9[UniverseChainId.Mainnet].address),
        balance: parseEther('1000000'),
      })
      await page.route(
        `${getUniswapServiceUrls().tradingApiUrl}/${TRADING_API_PATHS.quote}`,
        async (route, request) => {
          const postData = await request.postData()
          const data = JSON.parse(postData ?? '{}')
          if (data.tokenOut === USDC_MAINNET.address) {
            await route.continue()
          } else {
            await route.fulfill({ path: Mocks.UniswapX.quote })
          }
        },
      )
      await page.route(`${getUniswapServiceUrls().tradingApiUrl}/${TRADING_API_PATHS.order}`, async (route) => {
        await route.fulfill({ path: Mocks.UniswapX.openOrder })
      })
      // limit_cancel_timeout on: flag-off the cancel dialog only reaches "Cancellation
      // successful" via the backend order poller, which can never adjudicate this mocked
      // order as cancelled; flag-on the tracked cancel tx finalizes from the anvil receipt
      await page.goto(
        `/swap?inputCurrency=${WETH9[UniverseChainId.Mainnet].address}&outputCurrency=${DAI.address}&featureFlagOverride=limit_cancel_timeout`,
      )

      await page.getByTestId(TestID.AmountInputIn).fill('1')
      await page.getByTestId(TestID.ReviewSwap).click()
      await page.getByTestId(TestID.Swap).click()
    })

    test('can swap using uniswapX with WETH as input', async ({ page }) => {
      await page.route(UNISWAP_X_ORDERS_ENDPOINT, async (route) => {
        await route.fulfill({
          path: Mocks.UniswapX.filledOrders,
        })
      })

      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Approved')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Swapping 1.00 WETH for 3,665.13 DAI' })).toBeVisible()
    })

    test('renders error view if uniswapx order expires', async ({ page }) => {
      await page.route(UNISWAP_X_ORDERS_ENDPOINT, async (route) => {
        await route.fulfill({ path: Mocks.UniswapX.expiredOrders })
      })

      await expect(page.getByTestId(TestID.ActivityPopup).getByText('Swap expired')).toBeVisible()
    })

    test('cancels a pending uniswapx order', async ({ page }) => {
      // Two order-status endpoints gate this flow. (1) Confirm-time pre-check (checkCancelOrder)
      // GETs the trading API /orders; the mocked 20-byte ZERO_ADDRESS hash draws a live 400
      // (32-byte hashes required), aborting onConfirm before the cancel tx is sent — serve it an
      // open order. (2) After broadcast, the dialog flips to "Cancellation successful" only when
      // the interface-gateway /v2/orders poller returns a FINAL status for the orderHash
      // (updateOrders never lets a Cancelling order exit on non-final statuses, and the flag-on
      // receipt path only fires after the 120s cancel deadline). The live poller 400s on the same
      // 20-byte hash, so the order stays Cancelling forever. Statefully mock it: open until the
      // pre-check fires (Proceed clicked, cancel tx follows immediately), cancelled after.
      let cancelRequested = false
      await page.route(getTradingApiEndpointPattern(V1_TRADING_API_PATHS.orders), async (route) => {
        cancelRequested = true
        await route.fulfill({ path: Mocks.UniswapX.openOrders })
      })
      await page.route(UNISWAP_X_ORDERS_ENDPOINT, async (route) => {
        await route.fulfill({ path: cancelRequested ? Mocks.UniswapX.cancelledOrders : Mocks.UniswapX.openOrders })
      })

      await page.getByTestId(TestID.Web3StatusConnected).click()
      await page.getByText('Swapping').click()
      await page.getByText('Cancel').click()
      await page.getByRole('button', { name: 'Proceed' }).click()

      // Poller backoff reaches 30s between ticks by cancel time; the default 15s expect
      // timeout can expire before the first post-cancel poll lands
      await expect(page.getByText('Cancellation successful')).toBeVisible({ timeout: 45_000 })
    })

    test('deduplicates remote vs local uniswapx orders', async ({ page, dataApi }) => {
      await page.route(UNISWAP_X_ORDERS_ENDPOINT, async (route) => {
        await route.fulfill({ path: Mocks.UniswapX.filledOrders })
      })

      await dataApi.intercept(listTransactions, Mocks.DataApiService.list_transactions_uniswapx)
      await page.getByTestId(TestID.Web3StatusConnected).click()
      const drawer = page.getByTestId(TestID.AccountDrawer)
      await expect(drawer.getByText('Swapping')).not.toBeVisible()
      await expect(drawer.getByText('Swapped')).toBeVisible()
    })
  },
)
