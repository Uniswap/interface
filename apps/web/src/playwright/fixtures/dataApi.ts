import path from 'path'
// oxlint-disable-next-line no-restricted-imports -- Data API fixtures need direct Playwright imports
import { test as base, type Route } from '@playwright/test'
import {
  getPortfolio,
  getTokenPrices,
  listTransactions,
} from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import {
  buildTokenPricesResponse,
  fetchLiveResponseWithDeadline,
  FORCE_TOKEN_DATA_FALLBACK,
  LIVE_RESPONSE_TIMEOUT_MS,
  parseLiveTokenPrices,
  type TokenPriceRequest,
} from '~/playwright/fixtures/tokenDataFallbacks'
import { Mocks } from '~/playwright/mocks/mocks'

// TransactionTypeFilter enum values from client-data-api (used in ListTransactions request filter)
const TRANSACTION_TYPE_FILTER_SEND = 'TRANSACTION_TYPE_FILTER_SEND'
const TRANSACTION_TYPE_FILTER_RECEIVE = 'TRANSACTION_TYPE_FILTER_RECEIVE'

/**
 * Parses a Connect RPC unary request body, regardless of whether the client sent
 * it as a POST JSON body or (some callers, e.g. connect-query GETs) as a `message`
 * query param. Mirrors the parsing already done for ListTransactions below.
 */
export function parseConnectRequestBody(request: { url(): string; postData(): string | null }): unknown {
  try {
    const url = new URL(request.url())
    const messageParam = url.searchParams.get('message')
    if (messageParam) {
      return JSON.parse(decodeURIComponent(messageParam))
    }
    const postData = request.postData()
    return postData ? JSON.parse(postData) : null
  } catch {
    return null
  }
}

type GetTokenPricesRequestBody = {
  tokens?: TokenPriceRequest[]
}

/**
 * Responds to GetTokenPrices with a price for every token the request actually asked about,
 * taking the live price where the price service returns a usable one and a fallback anchor
 * otherwise (see buildTokenPricesResponse for why live has to win). Every token gets answered:
 * these prices back `usePrice()`/`useUSDCPrice()` (packages/prices/src/hooks/usePrice.ts), and a
 * flow that converts a fiat amount to a token amount (e.g. Send) stays disabled without one.
 */
async function fulfillGetTokenPrices(route: Route): Promise<void> {
  const body = parseConnectRequestBody(route.request()) as GetTokenPricesRequestBody | null
  const requestedTokens = body?.tokens ?? []

  const liveResponse = await fetchLiveResponseWithDeadline({
    route,
    timeoutMs: LIVE_RESPONSE_TIMEOUT_MS,
    forceFallback: FORCE_TOKEN_DATA_FALLBACK,
  })
  const liveBody = liveResponse?.ok() ? await liveResponse.json().catch(() => null) : null
  const livePrices = parseLiveTokenPrices(liveBody)

  // A token served from an anchor is the same state as the stale-constant failure this fixture
  // replaced, and invisible in a trace otherwise — say so when it happens.
  if (requestedTokens.length > 0 && livePrices.length < requestedTokens.length) {
    console.warn(
      `GetTokenPrices: ${requestedTokens.length - livePrices.length}/${requestedTokens.length} tokens served from fallback anchors (live status: ${liveResponse?.status() ?? 'none'})`,
    )
  }

  // Build outside the try: a builder throw must fail the spec loudly, not hang the route.
  const json = buildTokenPricesResponse({ requestedTokens, livePrices, updatedAt: new Date().toISOString() })

  try {
    await route.fulfill({ json })
  } catch (error) {
    // Page/test torn down mid-flight; nothing left to serve
    console.warn('GetTokenPrices fulfill error:', error)
  }
}

/** Method descriptor from Connect RPC (e.g. listTransactions, getPortfolio). Used so API changes fail at build time. */
type DataApiMethodDescriptor = {
  readonly service: { readonly typeName: string }
  readonly name: string
}

function getServiceMethodPath(method: DataApiMethodDescriptor): string {
  return `${method.service.typeName}/${method.name}`
}

export type DataApiIntercept = DataApiFixture['dataApi']

type DataApiFixture = {
  interceptLongRunning: void
  interceptTokenPrices: void
  dataApi: {
    /**
     * Intercepts a Data API endpoint and responds with a mock response.
     * Each call registers a route for that method's URL (Connect RPC uses one URL per method).
     * Use method descriptors from @uniswap/client-data-api (e.g. listTransactions, getPortfolio)
     * so that API renames or changes fail at build time.
     *
     * @param method - The Connect RPC method descriptor (e.g. listTransactions).
     * @param mockPath - The path to the mock response file.
     */
    intercept: (method: DataApiMethodDescriptor, mockPath: string) => Promise<void>
  }
}

/**
 * Parses filterTransactionTypes from a ListTransactions request (GET message param or POST body).
 * Returns the mock path for the filter (sends/receives) or the default path.
 */
function getListTransactionsMockPath({
  requestUrl,
  postData,
  defaultPath,
}: {
  requestUrl: string
  postData: string | undefined
  defaultPath: string
}): string {
  let body: { filterTransactionTypes?: (string | number)[] } | null = null
  try {
    const url = new URL(requestUrl)
    const messageParam = url.searchParams.get('message')
    if (messageParam) {
      body = JSON.parse(decodeURIComponent(messageParam)) as { filterTransactionTypes?: (string | number)[] }
    } else if (postData) {
      body = JSON.parse(postData) as { filterTransactionTypes?: (string | number)[] }
    }
  } catch {
    return defaultPath
  }
  if (!body?.filterTransactionTypes || !Array.isArray(body.filterTransactionTypes)) {
    return defaultPath
  }
  // Only serve filtered mocks when using the full list_transactions mock (not empty or other variants)
  // oxlint-disable-next-line no-shadow
  const base = path.basename(defaultPath, path.extname(defaultPath))
  if (base !== 'list_transactions') {
    return defaultPath
  }

  const filterTypes = body.filterTransactionTypes
  const dir = path.dirname(defaultPath)
  if (filterTypes.includes(TRANSACTION_TYPE_FILTER_SEND) && filterTypes.length === 1) {
    return path.join(dir, `${base}_sends.json`)
  }
  if (filterTypes.includes(TRANSACTION_TYPE_FILTER_RECEIVE) && filterTypes.length === 1) {
    return path.join(dir, `${base}_receives.json`)
  }
  return defaultPath
}

export const test = base.extend<DataApiFixture>({
  async dataApi({ page }, use) {
    const intercept = async (method: DataApiMethodDescriptor, mockPath: string) => {
      // Pattern matches both `/v2/{service}/{method}` and `/{service}/{method}` — DataApi routes
      // through the entry gateway (no `/v2` prefix) in some environments. See
      // packages/api/src/clients/base/urls.ts for the routing logic.
      const urlPattern = `**/${getServiceMethodPath(method)}`
      await page.route(urlPattern, async (route) => {
        const request = route.request()
        const url = request.url()
        try {
          let resolvedPath = path.resolve(__dirname, mockPath)
          if (getServiceMethodPath(method) === getServiceMethodPath(listTransactions)) {
            resolvedPath = getListTransactionsMockPath({
              requestUrl: url,
              postData: request.postData() ?? undefined,
              defaultPath: resolvedPath,
            })
          }
          await route.fulfill({ path: resolvedPath })
        } catch (error) {
          console.warn('Data API intercept error:', error)
          await route.continue()
        }
      })
    }

    // oxlint-disable-next-line react-hooks/rules-of-hooks -- Playwright fixture `use()` is not a React hook
    await use({ intercept })
  },
  // Default GetPortfolio mock for connected-wallet e2e (replaces legacy PortfolioBalances GraphQL intercept).
  interceptLongRunning: [
    async ({ dataApi }, use) => {
      await dataApi.intercept(getPortfolio, Mocks.DataApiService.get_portfolio)
      await use(undefined)
    },
    { auto: true },
  ],
  // Default GetTokenPrices route: live-first, with a per-token fallback anchor so no requested
  // token ever comes back unpriced (any fiat<->token conversion, e.g. Send's amount input, hangs
  // forever on a missing price). Response is assembled per-request (not a static mock file) since
  // the token list varies by flow, and it must stay live-first because the limit form rejects a
  // market-price reference that diverges from these prices — see buildTokenPricesResponse.
  interceptTokenPrices: [
    async ({ page }, use) => {
      await page.route(`**/${getServiceMethodPath(getTokenPrices)}`, fulfillGetTokenPrices)
      await use(undefined)
    },
    { auto: true },
  ],
})
