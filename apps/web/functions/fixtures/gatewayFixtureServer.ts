import { createServer, IncomingMessage, Server } from 'node:http'
import { gatewayFixtureResponses } from './gatewayResponses'

/**
 * Local stand-in for the interface GraphQL gateway used by the cloud-function
 * tests. The dev-server worker (functions/client.ts) is pointed here via
 * CLOUD_FUNCTIONS_GRAPHQL_ENDPOINT_OVERRIDE so meta-tag / OG-image tests
 * replay checked-in responses instead of depending on live gateway latency.
 */

const ROOT_FIELD_BY_OPERATION: Record<string, string> = {
  TokenWeb: 'token',
  V4Pool: 'v4Pool',
  V3Pool: 'v3Pool',
  V2Pair: 'v2Pair',
}

interface ParsedGraphQLRequest {
  operationName: string
  chain: string
  address: string
}

function parseGraphQLRequest(raw: string): ParsedGraphQLRequest | undefined {
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return undefined
  }
  if (typeof body !== 'object' || body === null) {
    return undefined
  }
  const { operationName, variables } = body as { operationName?: unknown; variables?: unknown }
  if (typeof operationName !== 'string') {
    return undefined
  }
  const vars = typeof variables === 'object' && variables !== null ? (variables as Record<string, unknown>) : {}
  const chain = typeof vars.chain === 'string' ? vars.chain : ''
  const rawAddress = vars.address ?? vars.poolId
  const address = typeof rawAddress === 'string' ? rawAddress.toLowerCase() : ''
  return { operationName, chain, address }
}

function resolveResponse(parsed: ParsedGraphQLRequest): object {
  const key = `${parsed.operationName}:${parsed.chain}:${parsed.address}`
  const fixture = gatewayFixtureResponses[key]
  if (fixture) {
    return fixture
  }

  const rootField = ROOT_FIELD_BY_OPERATION[parsed.operationName]
  if (!rootField) {
    // Unknown operation — a new query was added to the worker without a
    // fixture. Warn loudly so the failure is diagnosable from test output.
    console.warn(
      `[gateway-fixtures] no fixture for operation "${parsed.operationName}" — ` +
        `add one to functions/fixtures/gatewayResponses.ts`,
    )
    return { data: null }
  }

  // Same shape the live gateway returns for unknown assets; the
  // invalid-token/pool test cases depend on this.
  return { data: { [rootField]: null } }
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
        const parsed = parseGraphQLRequest(raw)
        if (!parsed) {
          res.writeHead(400, { 'Content-Type': 'application/json' })
          res.end(JSON.stringify({ errors: [{ message: 'gateway fixture server: malformed GraphQL request' }] }))
          return
        }
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(resolveResponse(parsed)))
      })
      .catch(() => {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ errors: [{ message: 'gateway fixture server: failed to read request' }] }))
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
