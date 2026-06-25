import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { snakeCase } from '../../util'
import {
  APM_METRIC_PREFIX,
  MIN_REQUESTS_5M,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  apmTagFilter,
  rateDenominatorFloor,
  webResourceName,
} from './constants'

const env = settings.environment
const apmFilter = apmTagFilter(env)

/**
 * Per-endpoint monitor specification.
 *
 * Thresholds are derived from observed P95 baselines on load-test traffic where
 * data exists. Endpoints with no traffic yet get conservative defaults sized to
 * the operation class (e.g. signing endpoints get a wider budget than cheap
 * lookups because they include a Privy MPC roundtrip).
 *
 * `priority` reflects user-impact severity:
 *   1 = catastrophic (no signing, no auth)
 *   2 = revenue / security-sensitive
 *   3 = degradation visible to users
 *   4 = noisy / lower-impact
 */
interface EndpointSpec {
  /** Proto resource name, e.g. "Challenge" — matches the suffix in DD metric names. */
  name: string
  /** Latency threshold in seconds. Critical = alert, warning = pre-alert. */
  latency: { critical: number; warning: number }
  /** Error-rate threshold as a percentage (0–100). Critical = alert. */
  errorRate: { critical: number }
  /** Monitor priority. */
  priority: 1 | 2 | 3 | 4 | 5
  /** Optional note rendered into the runbook URL fragment for context. */
  notes?: string
}

/**
 * All 19 endpoints from the SRE plan, with baselines and reasoning.
 *
 * Baseline data (from load-test traffic, `env:local`):
 *
 *   Challenge                : N=1103, P95=6.4ms, P99=17ms     → critical 0.5s
 *   WalletSignIn             : N=6,    P95=401ms               → critical 2s
 *   PrepareAddAuthenticator  : N=9,    P95=29ms                → critical 1s
 *   Disconnect               : N=5,    P95=44ms                → critical 0.5s
 *   GetRecoveryConfig        : N=5,    P95=40ms                → critical 0.5s
 *   ListAuthenticators       : N=2,    P95=28ms                → critical 0.5s
 *   OprfEvaluate             : N=2,    P95=158ms               → critical 1s
 *   SetupRecovery            : N=1,    P95=231ms               → critical 2s
 *   ExecuteRecovery          : N=1,    P95=325ms               → critical 2s
 *   DeleteRecovery           : N=1,    P95=259ms               → critical 2s
 *   ReportDecryptionResult   : N=1,    P95=183ms               → critical 1s
 *
 *   No baseline yet (estimated based on operation class):
 *   CreateWallet             : multiple Privy API calls + MPC → critical 5s
 *   SignMessage              : Privy MPC sign                  → critical 3s
 *   SignTransaction          : Privy MPC sign                  → critical 3s
 *   SignTypedData            : Privy MPC sign                  → critical 3s
 *   Sign7702Authorization    : Privy MPC sign                  → critical 3s
 *   AddAuthenticator         : Privy quorum update             → critical 3s
 *   DeleteAuthenticator      : Privy quorum update             → critical 3s
 *   ExportSeedPhrase         : Privy + recovery key            → critical 5s
 *   ExportSeedPhraseWithRecovery : Privy + recovery flow       → critical 5s
 */
const endpoints: EndpointSpec[] = [
  // High-volume canary — strictest latency budget. P1 because every other
  // endpoint requires a prior Challenge round-trip; Challenge degradation
  // takes down the entire service surface.
  { name: 'Challenge', latency: { critical: 0.5, warning: 0.2 }, errorRate: { critical: 2 }, priority: 1 },

  // Auth + session. WalletSignIn is the primary auth flow — failures here
  // lock users out of their wallets entirely. P1 to match its success-rate
  // funnel monitor in business.ts.
  { name: 'WalletSignIn', latency: { critical: 2, warning: 1 }, errorRate: { critical: 5 }, priority: 1 },
  {
    name: 'PrepareAddAuthenticator',
    latency: { critical: 1, warning: 0.5 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'AddAuthenticator', latency: { critical: 3, warning: 2 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'DeleteAuthenticator',
    latency: { critical: 3, warning: 2 },
    errorRate: { critical: 5 },
    priority: 2,
  },
  {
    name: 'ListAuthenticators',
    latency: { critical: 0.5, warning: 0.2 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'Disconnect', latency: { critical: 0.5, warning: 0.2 }, errorRate: { critical: 5 }, priority: 3 },

  // Wallet creation + signing
  { name: 'CreateWallet', latency: { critical: 5, warning: 3 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignMessage', latency: { critical: 3, warning: 2 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignTransaction', latency: { critical: 3, warning: 2 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignTypedData', latency: { critical: 3, warning: 2 }, errorRate: { critical: 5 }, priority: 1 },
  {
    name: 'Sign7702Authorization',
    latency: { critical: 3, warning: 2 },
    errorRate: { critical: 5 },
    priority: 1,
  },

  // Crypto / recovery
  { name: 'OprfEvaluate', latency: { critical: 1, warning: 0.5 }, errorRate: { critical: 5 }, priority: 2 },
  { name: 'SetupRecovery', latency: { critical: 2, warning: 1 }, errorRate: { critical: 5 }, priority: 2 },
  { name: 'ExecuteRecovery', latency: { critical: 2, warning: 1 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'GetRecoveryConfig',
    latency: { critical: 0.5, warning: 0.2 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'DeleteRecovery', latency: { critical: 2, warning: 1 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'ReportDecryptionResult',
    latency: { critical: 1, warning: 0.5 },
    errorRate: { critical: 5 },
    priority: 3,
  },

  // Seed phrase export — P0 latency + paired security anomaly monitor in security.ts.
  {
    name: 'ExportSeedPhrase',
    latency: { critical: 5, warning: 3 },
    errorRate: { critical: 5 },
    priority: 1,
  },
  {
    name: 'ExportSeedPhraseWithRecovery',
    latency: { critical: 5, warning: 3 },
    errorRate: { critical: 5 },
    priority: 1,
  },
]

function endpointLatencyMonitor(spec: EndpointSpec): MonitorDefinition {
  const id = snakeCase(spec.name)
  const metric = `${APM_METRIC_PREFIX}_${spec.name}`
  // Volume-gate: scale p95 by (hits / clamp_min(hits, floor)) so a lone slow request in a quiet window can't page.
  const hits = `count:${metric}{${apmFilter}}.as_count()`
  return {
    id: `privy_embedded_wallet_${id}_latency_p95`,
    name: `P95 latency on ${spec.name}`,
    type: 'query alert',
    query: `avg(last_5m):( p95:${metric}{${apmFilter}} * ${hits} / clamp_min(${hits}, ${MIN_REQUESTS_5M}) ) > ${spec.latency.critical}`,
    alertBody: `P95 latency on \`${spec.name}\` exceeded ${spec.latency.critical}s over the last 5 minutes. Requires at least ${MIN_REQUESTS_5M} requests in the window before it can alert.${spec.notes ? `\n\n${spec.notes}` : ''}`,
    recoveryBody: `P95 latency on \`${spec.name}\` has recovered.`,
    team: TEAM,
    priority: spec.priority,
    thresholds: { critical: spec.latency.critical, warning: spec.latency.warning },
    logQuery: `service:privy-embedded-wallet @resource_name:"uniswap.privyembeddedwallet.v1.EmbeddedWalletService:${spec.name}"`,
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Endpoints with no current traffic will return no data — don't page on it.
    notifyNoData: false,
  }
}

function endpointErrorMonitor(spec: EndpointSpec): MonitorDefinition {
  const id = snakeCase(spec.name)
  // Rate from the entry web span (5xx-only via webResourceName), not the handler-span
  // `.errors` metric which also counts handled 4xx and paged on routine activity.
  // 4xx spikes are still watched by privy_embedded_wallet_4xx_anomaly.
  const resource = webResourceName(spec.name)
  const errors = `sum:trace.web.request.errors{${apmFilter},resource_name:${resource}}.as_count()`
  const hits = `sum:trace.web.request.hits{${apmFilter},resource_name:${resource}}.as_count()`
  const minRequests = rateDenominatorFloor(spec.errorRate.critical, MIN_REQUESTS_5M)
  return {
    id: `privy_embedded_wallet_${id}_error_rate`,
    name: `5xx error rate on ${spec.name}`,
    type: 'query alert',
    // `.errors` is only emitted once an error has occurred; when absent the division is
    // null, not zero (as_count() does not zero-fill), so the monitor stays silent via
    // `notifyNoData: false` below (do not flip it to true). The `hits` denominator is
    // floored via clamp_min so a lone 5xx in a low-traffic window cannot trip the rate.
    query: `sum(last_5m):( ${errors} / clamp_min(${hits}, ${minRequests}) ) * 100 > ${spec.errorRate.critical}`,
    alertBody: `5xx (server) error rate on \`${spec.name}\` is above ${spec.errorRate.critical}% over the last 5 minutes. Handled 4xx (auth / origin / validation failures) are excluded; see the 4xx anomaly monitor for client-error spikes. Requires at least ${minRequests} requests in the window before the rate can alert.`,
    recoveryBody: `5xx error rate on \`${spec.name}\` has recovered.`,
    team: TEAM,
    priority: spec.priority,
    thresholds: { critical: spec.errorRate.critical, warning: Math.max(1, spec.errorRate.critical / 2) },
    logQuery: `service:privy-embedded-wallet status:error @resource_name:"uniswap.privyembeddedwallet.v1.EmbeddedWalletService:${spec.name}"`,
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  }
}

export const privyEmbeddedWalletEndpointMonitors: MonitorDefinition[] = endpoints.flatMap((spec) => [
  endpointLatencyMonitor(spec),
  endpointErrorMonitor(spec),
])
