export const TEAM = 'privy-embedded-wallet'

export const PRIVY_EMBEDDED_WALLET_RUNBOOK =
  'https://www.notion.so/uniswaplabs/Privy-Embedded-Wallet-Oncall-Runbook-37bc52b2548b81afbb7bcc8b3f5200c2'

export const UNIVERSE_REPO_URL = 'https://github.com/Uniswap/universe'

export const SERVICE_README_URL = `${UNIVERSE_REPO_URL}/tree/main/packages/datadog-cloud/monitors/privy-embedded-wallet`

// ALB filter — privy-wallet-lb is the load balancer name in AWS.
// Scoped by environment from Pulumi stack config so prod/staging monitors don't overlap.
export const albTagFilter = (environment: string): string => `name:privy-wallet-lb,unienv:${environment}`

// APM filter for trace metrics. service:privy-embedded-wallet is the registered DD service name.
export const apmTagFilter = (environment: string): string => `service:privy-embedded-wallet,env:${environment}`

// Proto service prefix for per-resource handler-span APM metrics, emitted as
//   trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService_<Endpoint>.{hits,errors}
// The handler-span `.errors` count increments on ANY thrown error, including handled 4xx
// (auth / origin / validation), so it is unsuitable for error-rate monitors — use the
// web-span `webResourceName` below instead.
export const APM_METRIC_PREFIX = 'trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService'

// `resource_name` tag of the entry web span (`trace.web.request.*`) for an RPC. dd-trace
// lowercases the resource and rewrites the "POST " prefix to "post_", e.g.
//   POST /...EmbeddedWalletService/Challenge -> post_/...embeddedwalletservice/challenge
// The web span is error-flagged only on 5xx, so errors scoped to this resource exclude
// handled 4xx; the post_ prefix also scopes to POST, excluding CORS OPTIONS preflights.
export const webResourceName = (endpoint: string): string =>
  `post_/uniswap.privyembeddedwallet.v1.embeddedwalletservice/${endpoint.toLowerCase()}`

// Base request-count floor for low-traffic suppression. privy-embedded-wallet is low-traffic,
// so a lone failure or single slow request can otherwise cross a threshold and page. Combined
// with the threshold via rateDenominatorFloor in rate monitors, and used directly as the
// volume-gate divisor in latency monitors.
export const MIN_REQUESTS_5M = 20

// The ALB sees whole-service traffic (incl. OPTIONS preflights), so it floors higher.
export const MIN_ALB_REQUESTS_5M = 30

// Denominator floor for a rate monitor: the larger of the base request-count floor and
// ceil(100 / failurePct), the smallest count at which a single failure stays under failurePct%.
// clamp_min'ing the denominator to this keeps one failure in a quiet window from paging.
export const rateDenominatorFloor = (failurePct: number, baseFloor: number): number =>
  Math.max(baseFloor, Math.ceil(100 / failurePct))
