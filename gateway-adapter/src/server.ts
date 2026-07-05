/**
 * graphql-yoga host for the HookSwap gateway-schema adapter.
 *
 * Serves the interface's EXACT gateway GraphQL SDL (../schema.graphql) so the interface's generated
 * operations validate. It is a HYBRID:
 *   - Subgraph-backed ops (topV3Pools / v3Pool / token / tokens / isV3SubgraphStale — see
 *     resolvers.ts LOCAL_QUERY_FIELDS) are resolved locally against the per-chain v3-subgraph.
 *   - EVERY other operation (portfolio balances, NFTs, token projects/CMS, v2/v4, convert, search,
 *     ...) is PROXIED verbatim to the real Uniswap gateway (UPSTREAM_GATEWAY_URL) and its response
 *     returned unchanged. A v3-subgraph simply cannot serve balances/NFTs, so passthrough is
 *     essential to keep the app working while we own the pool/token/price surface.
 *
 * Proxy decision (onParams plugin): a request executes locally ONLY if it is a query whose every
 * selected ROOT field is in LOCAL_QUERY_FIELDS (introspection `__*` also local). Anything else is
 * proxied. NO data is ever fabricated: if a proxy is needed but UPSTREAM_GATEWAY_URL is unset, a
 * GraphQL error is returned.
 *
 * Run: `npm run dev` (ts-node) or `npm run build && npm start`.
 */

import { readFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { parse, type DocumentNode, type FieldNode, type OperationDefinitionNode } from 'graphql'
import { createYoga, type Plugin } from 'graphql-yoga'
import fetch from 'cross-fetch'
import { LOCAL_QUERY_FIELDS, resolvers } from './resolvers'

const PORT = Number(process.env.PORT || 4000)
const GRAPHQL_ENDPOINT = process.env.GRAPHQL_ENDPOINT || '/v1/graphql'
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN || '*'
const UPSTREAM_GATEWAY_URL = process.env.UPSTREAM_GATEWAY_URL || ''

/** The served SDL lives at the project root (copied from packages/api/.../schema.graphql at build). */
function loadSchemaSDL(): string {
  // dist/server.js -> ../schema.graphql ; src/server.ts (ts-node) -> ../schema.graphql. Both = root.
  return readFileSync(join(__dirname, '..', 'schema.graphql'), 'utf8')
}

const schema = makeExecutableSchema({
  typeDefs: loadSchemaSDL(),
  resolvers,
  // The interface's SDL has directives/scalars we don't implement (custom scalars resolve as JSON
  // passthrough by default in graphql-js; that's fine — we only serve a handful of fields locally).
})

interface GraphQLParams {
  query?: string
  variables?: Record<string, unknown>
  operationName?: string
  extensions?: Record<string, unknown>
}

/**
 * Evaluate @skip / @include on a root field so an EXCLUDED field doesn't force a whole query to proxy.
 * The interface's `PoolPriceHistory` / `PoolVolumeHistory` carry `v4Pool` + `v3Pool` + `v2Pair` root
 * fields all gated by booleans (`$isV4/$isV3/$isV2`); only one branch is actually requested. Without
 * this, the presence of the un-served `v4Pool`/`v2Pair` fields would proxy the whole (v3-serveable)
 * request. Returns true if the field is excluded (`@skip(if: true)` or `@include(if: false)`).
 */
function isFieldExcluded(field: FieldNode, variables?: Record<string, unknown>): boolean {
  for (const d of field.directives ?? []) {
    const dir = d.name.value
    if (dir !== 'skip' && dir !== 'include') {
      continue
    }
    const ifArg = d.arguments?.find((a) => a.name.value === 'if')
    if (!ifArg) {
      continue
    }
    let val: boolean | undefined
    if (ifArg.value.kind === 'BooleanValue') {
      val = ifArg.value.value
    } else if (ifArg.value.kind === 'Variable') {
      val = Boolean(variables?.[ifArg.value.name.value])
    }
    if (val === undefined) {
      continue
    }
    if (dir === 'skip' && val) {
      return true // @skip(if: true) -> field is dropped
    }
    if (dir === 'include' && !val) {
      return true // @include(if: false) -> field is dropped
    }
  }
  return false
}

/**
 * Decide whether a request can be served locally. Returns true only for a query whose every root
 * selection is a field in LOCAL_QUERY_FIELDS (or an introspection field), ignoring root fields that
 * are excluded by @skip/@include. Everything else -> proxy.
 */
function canServeLocally(params: GraphQLParams): boolean {
  if (!params.query) {
    return false
  }
  let doc: DocumentNode
  try {
    doc = parse(params.query)
  } catch {
    return false // unpar. seable -> let the proxy/upstream (or yoga error) deal with it
  }
  const op = doc.definitions.find(
    (d): d is OperationDefinitionNode =>
      d.kind === 'OperationDefinition' &&
      (params.operationName ? d.name?.value === params.operationName : true),
  )
  if (!op || op.operation !== 'query') {
    return false // mutations/subscriptions -> proxy
  }
  for (const sel of op.selectionSet.selections) {
    if (sel.kind !== 'Field') {
      return false // fragment spread / inline fragment at root -> be conservative, proxy
    }
    if (isFieldExcluded(sel, params.variables)) {
      continue // @skip(if:true) / @include(if:false) -> this root field won't execute; ignore it
    }
    const name = sel.name.value
    if (name.startsWith('__')) {
      continue // introspection field -> local
    }
    if (!LOCAL_QUERY_FIELDS.has(name)) {
      return false // at least one root field we don't serve -> proxy the whole request
    }
  }
  return true
}

/** Forward a GraphQL request verbatim to the upstream Uniswap gateway and return its JSON result. */
async function proxyUpstream(params: GraphQLParams): Promise<unknown> {
  if (!UPSTREAM_GATEWAY_URL) {
    return {
      errors: [
        {
          message:
            'This operation is not served by the HookSwap subgraph adapter and UPSTREAM_GATEWAY_URL ' +
            'is not configured, so it cannot be proxied. Set UPSTREAM_GATEWAY_URL. (No data is fabricated.)',
        },
      ],
    }
  }
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  for (const pair of (process.env.UPSTREAM_HEADERS || '').split(',')) {
    const idx = pair.indexOf(':')
    if (idx > 0) {
      headers[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim()
    }
  }
  const res = await fetch(UPSTREAM_GATEWAY_URL, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      query: params.query,
      variables: params.variables,
      operationName: params.operationName,
      extensions: params.extensions,
    }),
  })
  return res.json()
}

/**
 * Yoga plugin implementing the passthrough. In onParams we short-circuit with the upstream result
 * for any request we don't serve locally; otherwise we let yoga execute against `schema`.
 */
const proxyPlugin: Plugin = {
  // `payload` is typed by the `Plugin` annotation (once graphql-yoga is installed): it carries
  // `params` (the GraphQL request) and `setResult` (short-circuits execution with a given result).
  async onParams(payload) {
    const params = payload.params as GraphQLParams
    if (canServeLocally(params)) {
      return
    }
    const result = await proxyUpstream(params)
    payload.setResult(result as never)
  },
}

const yoga = createYoga({
  schema,
  graphqlEndpoint: GRAPHQL_ENDPOINT,
  landingPage: false,
  cors: {
    origin: CORS_ALLOW_ORIGIN,
    credentials: true,
    // Mirror the headers the interface's graphql client sets on gateway calls.
    allowedHeaders: ['content-type', 'x-api-key', 'origin', 'x-request-source', 'x-app-version'],
    methods: ['GET', 'POST', 'OPTIONS'],
  },
  plugins: [proxyPlugin],
})

const server = createServer((req, res) => {
  if (req.url === '/health') {
    const configuredChains = Object.keys(process.env)
      .filter((k) => k.startsWith('SUBGRAPH_URL_') && (process.env[k] || '').trim().length > 0)
      .map((k) => k.replace('SUBGRAPH_URL_', ''))
    res.writeHead(200, { 'content-type': 'application/json' })
    res.end(
      JSON.stringify({
        status: 'ok',
        graphqlEndpoint: GRAPHQL_ENDPOINT,
        upstreamConfigured: Boolean(UPSTREAM_GATEWAY_URL),
        subgraphChains: configuredChains,
        localFields: [...LOCAL_QUERY_FIELDS],
      }),
    )
    return
  }
  // Everything else (the GraphQL endpoint) is handled by yoga.
  void yoga(req, res)
})

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[hookswap-gateway-adapter] listening on :${PORT}${GRAPHQL_ENDPOINT}  ` +
      `(local: ${[...LOCAL_QUERY_FIELDS].join(',')}; upstream proxy: ${UPSTREAM_GATEWAY_URL || 'UNSET'})`,
  )
})

export { yoga, schema, canServeLocally }
