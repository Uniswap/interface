import { readFileSync } from 'node:fs'
import type { MethodInfo, ServiceType } from '@bufbuild/protobuf'
// oxlint-disable-next-line no-restricted-imports -- Liquidity Service fixtures need direct Playwright imports
import { type Page } from '@playwright/test'
import { LiquidityService } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/api_connect'
import { ChainId } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v1/types_pb'
import { LiquidityService as LiquidityServiceV2 } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_connect'
import { getUniswapServiceUrls } from '~/config'
import { parseConnectRequestBody } from '~/playwright/fixtures/dataApi'
import { TEST_WALLET_ADDRESS } from '~/playwright/fixtures/wallets'

/**
 * Helper to construct the Connect/gRPC-web endpoint path from a service method
 * @example
 * const endpoint = getServiceMethodPath(LiquidityService, LiquidityService.methods.migrateV3ToV4LPPosition)
 * // Returns: "uniswap.liquidity.v1.LiquidityService/MigrateV3ToV4LPPosition"
 */
function getServiceMethodPath(service: ServiceType, method: MethodInfo): string {
  return `${service.typeName}/${method.name}`
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
 * Generic helper function to stub liquidity service endpoints and disable transaction simulation
 *
 * Note: Connect/gRPC-web can use either binary protobuf or JSON encoding.
 * We force JSON mode by setting appropriate headers so we can modify the response in tests.
 *
 * @example Using method definition (type-safe):
 * ```ts
 * await stubLiquidityServiceEndpoint({
 *   page,
 *   endpoint: LiquidityService.methods.migrateV3ToV4LPPosition,
 * })
 * ```
 */
export async function stubLiquidityServiceEndpoint({
  page,
  endpoint,
  service = LiquidityService,
  modifyRequestData,
  modifyResponseData,
}: {
  page: Page
  endpoint: MethodInfo
  service?: ServiceType
  modifyRequestData?: (data: any) => any
  modifyResponseData?: (data: any) => any
}) {
  const endpointPath = getServiceMethodPath(service, endpoint)

  // Liquidity service uses Connect/gRPC-web protocol with specific path structure
  // The endpoint will be something like: uniswap.liquidity.v1.LiquidityService/MigrateV3ToV4LPPosition
  await page.route(`${getUniswapServiceUrls().liquidityServiceUrl}/${endpointPath}*`, async (route) => {
    try {
      const request = route.request()

      // Force Connect to use JSON format instead of binary protobuf
      // This allows us to parse and modify the request/response
      const headers = {
        ...request.headers(),
        'content-type': 'application/json',
      }

      const postData = JSON.parse(request.postData() ?? '{}')

      let modifiedData = {
        ...postData,
        // Disable transaction simulation because we can't actually simulate the transaction or it will fail
        // Because the liquidity service uses the actual blockchain to simulate the transaction, whereas playwright is running an anvil fork
        simulateTransaction: false,
      }

      if (modifyRequestData) {
        modifiedData = modifyRequestData(modifiedData)
      }

      // Fetch with modified request, forcing JSON response
      const response = await route.fetch({
        method: request.method(),
        headers,
        postData: JSON.stringify(modifiedData),
      })

      let responseJson = JSON.parse(await response.text())

      if (modifyResponseData) {
        responseJson = modifyResponseData(responseJson)
      }

      await route.fulfill({
        status: response.status(),
        headers: {
          ...response.headers(),
          'content-type': 'application/json',
        },
        body: JSON.stringify(responseJson),
      })
    } catch (error) {
      const { ignored } = shouldIgnorePageError(error)
      if (ignored) {
        return
      }

      throw error
    }
  })
}

/** Anchored to the path end so `GetWalletPositions` does not also match `GetWalletPositionsBalance`. */
function matchesLiquidityServiceMethod(service: ServiceType, method: MethodInfo): (url: URL) => boolean {
  const methodPath = `/${getServiceMethodPath(service, method)}`
  return (url) => url.pathname.endsWith(methodPath)
}

export async function mockLiquidityServiceEndpoint({
  page,
  service,
  endpoint,
  mockPath,
}: {
  page: Page
  service: ServiceType
  endpoint: MethodInfo
  mockPath: string
}): Promise<void> {
  await page.route(matchesLiquidityServiceMethod(service, endpoint), async (route) => {
    await route.fulfill({ path: mockPath })
  })
}

/**
 * Serves a single-position `GetPosition` read from a static fixture (test wallet as owner, known
 * liquidity/fees). The live read returns the position's real mainnet owner and current on-chain
 * state, so ownership-gated UI stays hidden and reads like uncollected fees or liquidity drift to
 * zero as positions are closed onchain — the fixture pins them so the flows are deterministic.
 */
export async function mockGetPosition({ page, mockPath }: { page: Page; mockPath: string }): Promise<void> {
  await mockLiquidityServiceEndpoint({
    page,
    service: LiquidityServiceV2,
    endpoint: LiquidityServiceV2.methods.getPosition,
    mockPath,
  })
}

/**
 * Passes the live `GetPosition` response through, overriding only the given fields (owner by
 * default). Used where the on-chain position is still live and its real data is wanted, but the
 * UI's ownership gate needs the test wallet as owner. No fields are fabricated beyond the overrides.
 */
export async function stubGetPositionFields({
  page,
  overrides = { owner: TEST_WALLET_ADDRESS },
}: {
  page: Page
  overrides?: Record<string, unknown>
}): Promise<void> {
  await page.route(
    matchesLiquidityServiceMethod(LiquidityServiceV2, LiquidityServiceV2.methods.getPosition),
    async (route) => {
      try {
        const request = route.request()
        const response = await route.fetch({ headers: { ...request.headers(), 'content-type': 'application/json' } })
        const responseJson = JSON.parse(await response.text())
        const modified = responseJson?.position
          ? { ...responseJson, position: { ...responseJson.position, ...overrides } }
          : responseJson
        await route.fulfill({
          status: response.status(),
          headers: { ...response.headers(), 'content-type': 'application/json' },
          body: JSON.stringify(modified),
        })
      } catch (error) {
        const { ignored } = shouldIgnorePageError(error instanceof Error ? error : new Error(String(error)))
        if (ignored) {
          return
        }
        throw error
      }
    },
  )
}

/** GetWalletPositions is requested twice per view; the `modifier.hiddenOnly` complement is answered empty. */
export async function mockGetWalletPositions({ page, mockPath }: { page: Page; mockPath: string }): Promise<void> {
  const matcher = matchesLiquidityServiceMethod(LiquidityServiceV2, LiquidityServiceV2.methods.getWalletPositions)
  await page.route(matcher, async (route) => {
    const body = parseConnectRequestBody(route.request()) as {
      modifier?: { hiddenOnly?: boolean }
      chainIds?: (keyof typeof ChainId | number)[]
    } | null
    if (body?.modifier?.hiddenOnly) {
      await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ positions: [] }) })
      return
    }
    // Honor the chain filter like the service does, so a Blast-only exposure check doesn't see mainnet positions.
    const requestedChainIds = body?.chainIds?.map((id) => (typeof id === 'number' ? id : ChainId[id]))
    const mock = JSON.parse(readFileSync(mockPath, 'utf8')) as { positions: { chainId: number }[] }
    const positions = requestedChainIds?.length
      ? mock.positions.filter((position) => requestedChainIds.includes(position.chainId))
      : mock.positions
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ ...mock, positions }) })
  })
}
