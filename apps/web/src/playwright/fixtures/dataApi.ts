import path from 'path'
// oxlint-disable-next-line no-restricted-imports -- Data API fixtures need direct Playwright imports
import { test as base, type Route } from '@playwright/test'
import {
  getPortfolio,
  getTokenPrices,
  listTransactions,
} from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import { WETH_ADDRESS } from '@uniswap/universal-router-sdk'
import { DEFAULT_NATIVE_ADDRESS as NATIVE_TOKEN_ADDRESS } from '@universe/prices'
import { DAI, USDC, USDT } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { normalizeTokenAddressForCache } from 'uniswap/src/utils/currencyId'
import { WEETH_ADDRESS } from '~/playwright/anvil/utils'
import { Mocks } from '~/playwright/mocks/mocks'

// TransactionTypeFilter enum values from client-data-api (used in ListTransactions request filter)
const TRANSACTION_TYPE_FILTER_SEND = 'TRANSACTION_TYPE_FILTER_SEND'
const TRANSACTION_TYPE_FILTER_RECEIVE = 'TRANSACTION_TYPE_FILTER_RECEIVE'

// Plausible USD prices for the small set of tokens the anvil e2e suite actually
// uses (see allowedErc20BalanceAddresses in fixtures/anvil.ts). Keyed by
// lowercased address so it's chain-agnostic — good enough for these mainnet-only
// tests. Values don't need to track real markets, only be finite and > 0 so
// fiat<->token conversion (e.g. useUSDCPrice) produces a sensible amount.
const MOCK_TOKEN_USD_PRICES: Record<string, number> = {
  [NATIVE_TOKEN_ADDRESS]: 3000,
  [normalizeTokenAddressForCache(WETH_ADDRESS(UniverseChainId.Mainnet))]: 3000,
  [normalizeTokenAddressForCache(WEETH_ADDRESS)]: 3120,
  [normalizeTokenAddressForCache(USDC.address)]: 1,
  [normalizeTokenAddressForCache(USDT.address)]: 1,
  [normalizeTokenAddressForCache(DAI.address)]: 1,
}
const DEFAULT_MOCK_TOKEN_USD_PRICE = 3000

function priceForToken(address: string): number {
  return MOCK_TOKEN_USD_PRICES[normalizeTokenAddressForCache(address)] ?? DEFAULT_MOCK_TOKEN_USD_PRICE
}

/**
 * Parses a Connect RPC unary request body, regardless of whether the client sent
 * it as a POST JSON body or (some callers, e.g. connect-query GETs) as a `message`
 * query param. Mirrors the parsing already done for ListTransactions below.
 */
function parseConnectRequestBody(request: { url(): string; postData(): string | null }): unknown {
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
  tokens?: { chainId: number; address: string }[]
}

/**
 * Responds to GetTokenPrices with a price for every token the request actually
 * asked about. This backs `usePrice()`/`useUSDCPrice()`
 * (packages/prices/src/hooks/usePrice.ts), which the anvil browser context can't
 * otherwise reach — there's no live price service available in that
 * network-restricted environment. Without this, any flow that converts a fiat
 * amount to a token amount (e.g. Send) never resolves a price and stays disabled.
 */
async function fulfillGetTokenPrices(route: Route): Promise<void> {
  const body = parseConnectRequestBody(route.request()) as GetTokenPricesRequestBody | null
  const tokens = body?.tokens ?? []
  await route.fulfill({
    contentType: 'application/json',
    body: JSON.stringify({
      tokenPrices: tokens.map((token) => ({
        chainId: token.chainId,
        address: token.address,
        priceUsd: priceForToken(token.address),
        updatedAt: new Date().toISOString(),
      })),
    }),
  })
}

/** Method descriptor from Connect RPC (e.g. listTransactions, getPortfolio). Used so API changes fail at build time. */
type DataApiMethodDescriptor = {
  readonly service: { readonly typeName: string }
  readonly name: string
}

function getServiceMethodPath(method: DataApiMethodDescriptor): string {
  return `${method.service.typeName}/${method.name}`
}

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
  // Default GetTokenPrices mock. The anvil browser context has no route to the live
  // price service (WS/REST) that packages/prices normally talks to (see usePrice.ts),
  // so any fiat<->token conversion (e.g. Send's amount input) would otherwise hang
  // forever. Response is generated per-request (not a static mock file) since the
  // token list varies by flow.
  interceptTokenPrices: [
    async ({ page }, use) => {
      await page.route(`**/${getServiceMethodPath(getTokenPrices)}`, fulfillGetTokenPrices)
      await use(undefined)
    },
    { auto: true },
  ],
})
