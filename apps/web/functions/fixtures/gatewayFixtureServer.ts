import { createServer, IncomingMessage, Server } from 'node:http'
import { dataApiFixtureResponses, liquidityFixtureResponses } from './gatewayResponses'

/**
 * Local stand-in for the backend gateways used by the cloud-function tests.
 * The dev-server worker is pointed here via CLOUD_FUNCTIONS_DATA_API_ENDPOINT_OVERRIDE
 * (the data-api v2 connect-RPC POSTs getToken.ts makes) and
 * CLOUD_FUNCTIONS_LIQUIDITY_ENDPOINT_OVERRIDE (the liquidity v2 connect-RPC POSTs
 * getPool.ts / getPosition.ts make) so meta-tag / OG-image tests replay checked-in
 * responses instead of depending on live gateway latency.
 *
 * Data-api requests arrive at `/data.v2.DataApiService/<Method>`; liquidity requests at
 * `/uniswap.liquidity.v2.LiquidityService/<Method>`. Routing is by URL path.
 */

function parseJsonBody(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed === 'object' && parsed !== null) {
      return parsed as Record<string, unknown>
    }
  } catch {
    // fall through to an empty body
  }
  return {}
}

/**
 * Resolves a data-api v2 connect-RPC request. `method` is the RPC name from the URL (`GetToken`);
 * the identifying fields are read from the JSON body. An unmatched key returns an empty message —
 * no `token` field — which the invalid-token test cases depend on.
 */
function resolveDataApiResponse(method: string, raw: string): object {
  const body = parseJsonBody(raw)

  if (method === 'GetToken') {
    const chainId = typeof body.chainId === 'number' ? body.chainId : Number(body.chainId)
    const address = typeof body.address === 'string' ? body.address.toLowerCase() : ''
    return dataApiFixtureResponses[`GetToken:${chainId}:${address}`] ?? {}
  }
  console.warn(
    `[gateway-fixtures] no fixture handler for data-api method "${method}" — ` +
      `add one to functions/fixtures/gatewayFixtureServer.ts`,
  )
  return {}
}

/**
 * Resolves a liquidity v2 connect-RPC request. `method` is the RPC name from the URL
 * (`GetPool` / `GetPosition`); the identifying fields are read from the JSON body. An unmatched key
 * returns an empty message — the same "no pool / no position" shape the live service returns for an
 * unknown identifier, which the invalid-pool test cases depend on.
 */
function resolveLiquidityResponse(method: string, raw: string): object {
  const body = parseJsonBody(raw)

  if (method === 'GetPool') {
    const pool = typeof body.pool === 'object' && body.pool !== null ? (body.pool as Record<string, unknown>) : {}
    const chainId = typeof pool.chainId === 'number' ? pool.chainId : Number(pool.chainId)
    const addressOrId = typeof pool.addressOrId === 'string' ? pool.addressOrId.toLowerCase() : ''
    return liquidityFixtureResponses[`GetPool:${chainId}:${addressOrId}`] ?? {}
  }
  if (method === 'GetPosition') {
    const chainId = typeof body.chainId === 'number' ? body.chainId : Number(body.chainId)
    const version = typeof body.version === 'number' ? body.version : Number(body.version)
    const tokenId = typeof body.tokenId === 'string' ? body.tokenId.toLowerCase() : ''
    return liquidityFixtureResponses[`GetPosition:${chainId}:${version}:${tokenId}`] ?? {}
  }
  console.warn(
    `[gateway-fixtures] no fixture handler for liquidity method "${method}" — ` +
      `add one to functions/fixtures/gatewayFixtureServer.ts`,
  )
  return {}
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString()
    })
    req.on('end', () => resolve(raw))
    req.on('error', reject)
  })
}

/**
 * Starts the fixture server on the given port. Returns a handle that resolves
 * once the server is closed. Expected failures (port in use) reject the
 * returned promise.
 */
export async function startGatewayFixtureServer(port: number): Promise<{ close(): Promise<void> }> {
  const server: Server = createServer((req, res) => {
    readBody(req)
      .then((raw) => {
        const dataApiMethod = req.url?.match(/\/data\.v2\.DataApiService\/(\w+)$/)?.[1]
        if (dataApiMethod) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(resolveDataApiResponse(dataApiMethod, raw)))
          return
        }

        const liquidityMethod = req.url?.match(/\/uniswap\.liquidity\.v2\.LiquidityService\/(\w+)$/)?.[1]
        if (liquidityMethod) {
          res.writeHead(200, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify(resolveLiquidityResponse(liquidityMethod, raw)))
          return
        }

        // Unknown route — a new upstream call was added to the worker without a fixture route.
        // Warn loudly so the failure is diagnosable from test output.
        console.warn(`[gateway-fixtures] no fixture route for "${req.url}" — add one to gatewayFixtureServer.ts`)
        res.writeHead(404, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'gateway fixture server: unknown route' }))
      })
      .catch(() => {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ message: 'gateway fixture server: failed to read request' }))
      })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, '127.0.0.1', resolve)
  })

  return {
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()))
      }),
  }
}
