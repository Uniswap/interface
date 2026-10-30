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
// The post_ prefix scopes to POST, excluding CORS OPTIONS preflights. The web span is NOT
// error-flagged only on 5xx: dd-trace also flags some handled 4xx (401 on WalletSignIn, 403 on the
// authenticator RPCs), so every `trace.web.request.errors` numerator must add WEB_SERVER_ERRORS_ONLY.
export const webResourceName = (endpoint: string): string =>
  `post_/uniswap.privyembeddedwallet.v1.embeddedwalletservice/${endpoint.toLowerCase()}`

// Tag filter that drops handled 4xx from `trace.web.request.errors`, leaving 5xx plus any
// error-flagged span without a 4xx status (e.g. a timeout that surfaces as 200). Appended to a
// comma-joined scope: Datadog's parser rejects `AND NOT` mixed with commas. Leave `hits` unfiltered,
// since the denominator is all requests.
export const WEB_SERVER_ERRORS_ONLY = '!http.status_code:4*'

// Smallest server-error count a web-span rate monitor evaluates, in whatever window it runs.
// cutoff_min on a sum(last_Nm) query gates on the window total, not per point, so no rollup is needed.
// The clamp_min floor on `hits` already keeps one failure under the critical threshold; this also
// keeps it under the warning threshold, which sits at half of critical. Above 2, the 2026-10-09
// Challenge outage (2 x 503 over 49 requests) would no longer alert.
export const MIN_WEB_SERVER_ERRORS = 2

/** Numerator of a web-span server-error rate: no data while the window holds under MIN_WEB_SERVER_ERRORS. */
export const webServerErrors = (scope: string): string =>
  `cutoff_min(sum:trace.web.request.errors{${scope},${WEB_SERVER_ERRORS_ONLY}}.as_count(), ${MIN_WEB_SERVER_ERRORS})`

// Base request-count floor for the rate monitors. privy-embedded-wallet is low-traffic, so a
// lone failure can otherwise cross a threshold and page. Combined with the threshold via
// rateDenominatorFloor below.
export const MIN_REQUESTS_5M = 20

// The ALB sees whole-service traffic (incl. OPTIONS preflights), so it floors higher.
export const MIN_ALB_REQUESTS_5M = 30

// Denominator floor for a rate monitor: the larger of the base request-count floor and
// ceil(100 / failurePct), the smallest count at which a single failure stays under failurePct%.
// clamp_min'ing the denominator to this keeps one failure in a quiet window from paging.
export const rateDenominatorFloor = (failurePct: number, baseFloor: number): number =>
  Math.max(baseFloor, Math.ceil(100 / failurePct))

// Smallest failure count that can cross `failurePct` once the denominator is floored.
export const minFailuresToAlert = (failurePct: number, denominatorFloor: number): number =>
  Math.floor((failurePct * denominatorFloor) / 100) + 1

// The percentile and the request count both roll up over this interval, so the floor is a
// per-window count. Without an explicit rollup Datadog uses ~10s buckets, which never reach it.
export const LATENCY_ROLLUP_SECONDS = 1800

// Twice the rollup, so the window always holds one complete wall-clock-aligned rollup bucket.
export const LATENCY_WINDOW_SECONDS = 2 * LATENCY_ROLLUP_SECONDS

const SECONDS_PER_MINUTE = 60
const SECONDS_PER_HOUR = 3600

const datadogWindow = (seconds: number): string =>
  seconds % SECONDS_PER_HOUR === 0 ? `last_${seconds / SECONDS_PER_HOUR}h` : `last_${seconds / SECONDS_PER_MINUTE}m`

const durationLabel = (seconds: number): string => {
  if (seconds % SECONDS_PER_HOUR === 0) {
    const hours = seconds / SECONDS_PER_HOUR
    return `${hours} hour${hours === 1 ? '' : 's'}`
  }
  return `${seconds / SECONDS_PER_MINUTE} minutes`
}

// "30-minute", for prose that uses the duration as an adjective.
const durationAdjective = (seconds: number): string => durationLabel(seconds).replace(/s$/, '').replace(' ', '-')

export const LATENCY_WINDOW = datadogWindow(LATENCY_WINDOW_SECONDS)
export const LATENCY_WINDOW_LABEL = durationLabel(LATENCY_WINDOW_SECONDS)
export const LATENCY_ROLLUP_LABEL = durationLabel(LATENCY_ROLLUP_SECONDS)
export const LATENCY_ROLLUP_ADJECTIVE = durationAdjective(LATENCY_ROLLUP_SECONDS)

// Outbound-dependency latency runs on a tighter 5m rollup (api.privy.io has the traffic for it).
export const DEP_LATENCY_ROLLUP_SECONDS = 300
export const DEP_LATENCY_WINDOW_SECONDS = 2 * DEP_LATENCY_ROLLUP_SECONDS
export const DEP_LATENCY_WINDOW = datadogWindow(DEP_LATENCY_WINDOW_SECONDS)
export const DEP_LATENCY_WINDOW_LABEL = durationLabel(DEP_LATENCY_WINDOW_SECONDS)
export const DEP_LATENCY_ROLLUP_ADJECTIVE = durationAdjective(DEP_LATENCY_ROLLUP_SECONDS)

export const MIN_REQUESTS_DEP_LATENCY = 3

export const SUCCESS_RATE_WINDOW_SECONDS = 1800
export const SUCCESS_RATE_WINDOW = datadogWindow(SUCCESS_RATE_WINDOW_SECONDS)
export const SUCCESS_RATE_WINDOW_LABEL = durationLabel(SUCCESS_RATE_WINDOW_SECONDS)

// `max`, not `avg`: averaging the window's two buckets would dilute a regression in the newer one.
export const LATENCY_AGGREGATION = 'max'

// Datadog's p95 over n >= 2 samples excludes the slowest one, so with a floor of 3 a single slow
// request cannot breach a threshold. 2 is not enough: at n = 2 the "p95" is the faster call.
export const MIN_REQUESTS_PER_RPC_LATENCY = 3

// Whole-service traffic clears this in nearly every 30m bucket.
export const MIN_REQUESTS_AGGREGATE_LATENCY = 30

/**
 * Wrap a percentile in a volume gate: the percentile unchanged once the rolled-up `hits` reaches
 * `floor`, and no data below it.
 *
 * Do not use `clamp_min` here. On a percentile it rescales the threshold to
 * `threshold * floor / hits` instead of gating (one 10s request against a floor of 20 scored 0.5s).
 * The point is dropped by the `hits / cutoff_min(hits, floor)` composite; `cutoff_min` alone may
 * yield 0, which a latency monitor would read as healthy.
 *
 * `hits` must not carry `.as_count()`: Datadog rejects it alongside an explicit rollup unless the
 * time aggregator is `sum`, which would add the buckets' percentiles together.
 *
 * The rollup method on the percentile only matters for gauges such as
 * `aws.applicationelb.target_response_time.p95` (mean of per-minute p95s); APM trace metrics are
 * distributions, so Datadog merges the sketches.
 */
export const volumeGatedPercentile = (
  percentile: string,
  gate: { hits: string; floor: number; rollupSeconds?: number },
): string => {
  const rollup = gate.rollupSeconds ?? LATENCY_ROLLUP_SECONDS
  const rolledPercentile = `${percentile}.rollup(avg, ${rollup})`
  const rolledHits = `${gate.hits}.rollup(sum, ${rollup})`
  return `( ${rolledPercentile} * ${rolledHits} / cutoff_min(${rolledHits}, ${gate.floor}) )`
}
