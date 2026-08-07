/* oxlint-disable react-hooks/rules-of-hooks -- Playwright fixtures use `use()` which is not a React hook */
// oxlint-disable-next-line no-restricted-imports -- Trading API fixtures need direct Playwright imports
import { test as base, type Page, type Route } from '@playwright/test'
import { TRADING_API_PATHS, V1_TRADING_API_PATHS } from '@universe/api'
import { getUniswapServiceUrls } from '~/config'
import { Mocks } from '~/playwright/mocks/mocks'

const DEFAULT_TEST_GAS_LIMIT = '20000000'

/**
 * Anvil executes against the pinned block in fork-blocks.json while /swap prices execution
 * bounds from the live chain tip: the server rebuilds min-out/max-in from a fresh internal
 * quote and `quote.slippage`, ignoring any `minimumAmount`/`minAmount` rewritten into the
 * posted quote. Widening slippage in the /swap REQUEST is the only client-side lever that
 * reaches the executed calldata (verified: `quote.slippage: 25` yields a min-out of exactly
 * 0.75 × amountOut). On-chain balance assertions stay the regression signal.
 */
const WIDE_TEST_SLIPPAGE_PERCENT = 25

export function widenSwapRequestSlippage<T extends { quote?: { slippage?: number } }>(data: T): T {
  return data.quote ? { ...data, quote: { ...data.quote, slippage: WIDE_TEST_SLIPPAGE_PERCENT } } : data
}

const shouldIgnorePageError = (error: Error): { ignored: boolean } => {
  if (
    error.message.includes('Target page, context or browser has been closed') ||
    error.message.includes('Test ended')
  ) {
    console.log(`🟡 Ignored route error after page close: ${error.message}`)
    return { ignored: true }
  }

  return { ignored: false }
}

/**
 * Generic helper function to stub trading API endpoints and disable transaction simulation
 */
export async function stubTradingApiEndpoint({
  page,
  endpoint,
  modifyRequestData,
  modifyResponseData,
}: {
  page: Page
  endpoint: string
  modifyRequestData?: (data: any) => any
  modifyResponseData?: (data: any) => any
}) {
  const handler = async (route: Route) => {
    try {
      const request = route.request()
      const postData = request.postDataJSON()

      let modifiedData = {
        ...postData,
        // Disable transaction simulation because we can't actually simulate the transaction or it will fail
        // Because the TAPI uses the actual blockchain to simulate the transaction, whereas playwright is running an anvil fork
        simulateTransaction: false,
      }

      if (modifyRequestData) {
        modifiedData = modifyRequestData(modifiedData)
      }

      // Create a new request with modified data
      const response = await route.fetch({
        postData: JSON.stringify(modifiedData),
      })

      // Error bodies (404 NO_ROUTE, 429, ...) have none of the success-shape keys the
      // modifiers read; pass them through with their real status. Fulfilling them via
      // the success path used to re-serve them as 200 (fulfill's default status).
      if (!response.ok()) {
        await route.fulfill({ response })
        return
      }

      const responseText = await response.text()
      let responseJson
      try {
        responseJson = JSON.parse(responseText)
      } catch (parseError) {
        throw new Error(
          `Failed to parse trading API response for ${endpoint}. Request: ${JSON.stringify(modifiedData)}. Response: ${responseText}`,
          {
            cause: parseError,
          },
        )
      }

      // Set a high gas limit to avoid OutOfGas
      // Guard: some 2xx bodies still lack `swap` (shape drift safety)
      if (endpoint === V1_TRADING_API_PATHS.swap && responseJson.swap) {
        responseJson.swap.gasLimit = DEFAULT_TEST_GAS_LIMIT
      }

      if (modifyResponseData) {
        responseJson = modifyResponseData(responseJson)
      }

      // `response` carries the upstream status/headers; only the body is replaced
      await route.fulfill({
        response,
        body: JSON.stringify(responseJson),
      })
    } catch (error) {
      const { ignored } = shouldIgnorePageError(error)
      if (ignored) {
        return
      }

      throw error
    }
  }

  await page.route(getTradingApiEndpointPattern(endpoint), handler)
}

/**
 * URL pattern matching a trading API endpoint. The entry gateway serves trading at unversioned
 * paths, so requests no longer carry the `/v1` prefix. Callers still pass the versioned constant;
 * strip the version segment for matching. Match the exact endpoint path, optionally followed by
 * query params (e.g. /swap must not match /swappable_tokens or /swaps).
 */
export function getTradingApiEndpointPattern(endpoint: string): RegExp {
  const unversionedEndpoint = endpoint.replace(/^\/v1(?=\/)/, '')
  const escapedUrl = `${getUniswapServiceUrls().tradingApiUrl}${unversionedEndpoint}`.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )
  // oxlint-disable-next-line security/detect-non-literal-regexp -- escapedUrl is sanitized via regex escaping
  return new RegExp(`^${escapedUrl}(\\?.*)?$`)
}

/**
 * Fulfills a Trading API endpoint from a static recorded fixture (fully offline — no live
 * fetch, unlike `stubTradingApiEndpoint`). Use when the test must run without Trading API
 * egress (e.g. the hermetic WalletConnect swap spec).
 */
export async function mockTradingApiEndpoint({
  page,
  endpoint,
  mockPath,
}: {
  page: Page
  endpoint: string
  mockPath: string
}) {
  const unversionedEndpoint = endpoint.replace(/^\/v1(?=\/)/, '')
  const escapedUrl = `${getUniswapServiceUrls().tradingApiUrl}${unversionedEndpoint}`.replace(
    /[.*+?^${}()|[\]\\]/g,
    '\\$&',
  )
  // oxlint-disable-next-line security/detect-non-literal-regexp -- escapedUrl is sanitized via regex escaping
  await page.route(new RegExp(`^${escapedUrl}(\\?.*)?$`), async (route) => {
    await route.fulfill({ path: mockPath })
  })
}

/**
 * Fulfills the /swaps status-polling endpoint offline with a terminal status (default SUCCESS),
 * echoing the polled tx hash. Overrides the live `txPolling` fixture for fully-offline specs.
 */
export async function mockTradingApiSwapsStatus({ page, status = 'SUCCESS' }: { page: Page; status?: string }) {
  await page.route(`${getUniswapServiceUrls().tradingApiUrl}/${TRADING_API_PATHS.swaps}?txHashes=*`, async (route) => {
    const txHash = new URL(route.request().url()).searchParams.get('txHashes')
    await route.fulfill({
      body: JSON.stringify({
        requestId: 'mock-swaps-request-id',
        swaps: [{ swapType: 'CLASSIC', status, txHash, hashType: 'TX' }],
      }),
    })
  })
}

/**
 * Mocks the /swap endpoint with a static mock response
 * Use this instead of stubTradingApiEndpoint when you need to avoid calling the real API
 */
export async function mockTradingApiSwapResponse({ page }: { page: Page }) {
  await page.route(`**/${TRADING_API_PATHS.swap}`, async (route) => {
    await route.fulfill({ path: Mocks.TradingApi.swap })
  })
}

type TradingApiFixture = {
  txPolling: void
}

export const test = base.extend<TradingApiFixture>({
  // Intercept tx polling requests to trading api and succeed
  // https://entry-gateway.backend-staging.api.uniswap.org/swaps
  // {
  //     "requestId": "1b0bef68-a804-4532-b956-781bf9856229",
  //     "swaps": [
  //         {
  //             "status": "SUCCESS",
  //             "swapType": "CLASSIC",
  //             "txHash": "0x3feefd82ee859f26985bb90467361f49c42dde6f9c3c9199f5bc33849f74ecd0"
  //         }
  //     ]
  // }
  txPolling: [
    async ({ page }, use) => {
      try {
        await page.route(
          `${getUniswapServiceUrls().tradingApiUrl}/${TRADING_API_PATHS.swaps}?txHashes=*`,
          async (route) => {
            try {
              const response = await route.fetch()
              const responseText = await response.text()
              const responseJson = JSON.parse(responseText)
              if (responseJson.swaps?.[0]) {
                responseJson.swaps[0].status = 'SUCCESS'
              }

              return route.fulfill({
                body: JSON.stringify(responseJson),
              })
            } catch (error) {
              const { ignored } = shouldIgnorePageError(error)
              if (ignored) {
                return undefined
              }

              throw error
            }
          },
        )

        await use(undefined)
      } catch (e) {
        console.warn('[txPolling fixture] Failed to set up route interception:', e)
        await use(undefined)
      }
    },
    { auto: true },
  ],
})
