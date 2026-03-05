// biome-ignore lint/style/noRestrictedImports: Data API fixtures need direct Playwright imports
import { test as base } from '@playwright/test'
import { listTransactions } from '@uniswap/client-data-api/dist/data/v1/api-DataApiService_connectquery'
import path from 'path'

// TransactionTypeFilter enum values from client-data-api (used in ListTransactions request filter)
const TRANSACTION_TYPE_FILTER_SEND = 'TRANSACTION_TYPE_FILTER_SEND'
const TRANSACTION_TYPE_FILTER_RECEIVE = 'TRANSACTION_TYPE_FILTER_RECEIVE'

/** Method descriptor from Connect RPC (e.g. listTransactions, getPortfolio). Used so API changes fail at build time. */
type DataApiMethodDescriptor = {
  readonly service: { readonly typeName: string }
  readonly name: string
}

function getServiceMethodPath(method: DataApiMethodDescriptor): string {
  return `${method.service.typeName}/${method.name}`
}

type DataApiFixture = {
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
      const urlPattern = `**/v2/${getServiceMethodPath(method)}`
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

    await use({ intercept })
  },
})
