/**
 * Known telemetry source labels for the session gate. Wire sites pass one
 * of these as the `source` field; they surface in Datadog as `@tags.source`
 * on every `SessionGate.*` event the gate emits.
 *
 * The gate itself treats `source` as an opaque string — this registry is
 * for consumer-side consistency and grep-ability. Adding a new wire site:
 * append a value here, then reference it at the wire site.
 *
 * Living here (the lowest-layer package both `chains` and `api` depend on)
 * gives every consumer a single source of truth, without the gate library
 * caring about specific consumers.
 */
export const SessionGateSource = {
  UnirpcViem: 'unirpc-viem',
  UnirpcEthers: 'unirpc-ethers',
  ConnectRpcEntryGateway: 'connect-rpc-entry-gateway',
  ConnectRpcEntryGatewayProd: 'connect-rpc-entry-gateway-prod',
  FetchUniswap: 'fetch-uniswap',
  FetchTrading: 'fetch-trading',
  FetchFor: 'fetch-for',
} as const

export type SessionGateSource = (typeof SessionGateSource)[keyof typeof SessionGateSource]
