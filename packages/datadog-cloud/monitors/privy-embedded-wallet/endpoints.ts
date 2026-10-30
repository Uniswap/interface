import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { snakeCase } from '../../util'
import {
  APM_METRIC_PREFIX,
  LATENCY_AGGREGATION,
  LATENCY_ROLLUP_ADJECTIVE,
  LATENCY_WINDOW,
  LATENCY_WINDOW_LABEL,
  MIN_REQUESTS_5M,
  MIN_REQUESTS_PER_RPC_LATENCY,
  MIN_WEB_SERVER_ERRORS,
  minFailuresToAlert,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  apmTagFilter,
  rateDenominatorFloor,
  volumeGatedPercentile,
  webResourceName,
  webServerErrors,
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
 * All 20 endpoints from the SRE plan.
 *
 * `latency` is the gated 30-minute p95 in seconds. Where an endpoint has enough prod traffic to
 * measure, warning sits ~1.2-1.5x and critical ~2x above its 30-day baseline maximum. Endpoints
 * too sparse to measure borrow the thresholds of the nearest comparable endpoint.
 */
const endpoints: EndpointSpec[] = [
  // High-volume canary — strictest latency budget. P1 because every other
  // endpoint requires a prior Challenge round-trip; Challenge degradation
  // takes down the entire service surface.
  { name: 'Challenge', latency: { critical: 1, warning: 0.7 }, errorRate: { critical: 2 }, priority: 1 },

  // Auth + session. WalletSignIn is the primary auth flow — failures here
  // lock users out of their wallets entirely. P1 to match its success-rate
  // funnel monitor in business.ts.
  { name: 'WalletSignIn', latency: { critical: 2, warning: 1 }, errorRate: { critical: 5 }, priority: 1 },
  {
    name: 'PrepareAddAuthenticator',
    latency: { critical: 1, warning: 0.6 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'AddAuthenticator', latency: { critical: 1, warning: 0.6 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'DeleteAuthenticator',
    latency: { critical: 1, warning: 0.6 },
    errorRate: { critical: 5 },
    priority: 2,
  },
  {
    name: 'ListAuthenticators',
    latency: { critical: 0.4, warning: 0.25 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'Disconnect', latency: { critical: 0.5, warning: 0.2 }, errorRate: { critical: 5 }, priority: 3 },

  // Wallet creation + signing
  { name: 'CreateWallet', latency: { critical: 2.5, warning: 1.5 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignMessage', latency: { critical: 1, warning: 0.6 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignTransaction', latency: { critical: 1, warning: 0.6 }, errorRate: { critical: 5 }, priority: 1 },
  { name: 'SignTypedData', latency: { critical: 1, warning: 0.6 }, errorRate: { critical: 5 }, priority: 1 },
  {
    name: 'Sign7702Authorization',
    latency: { critical: 1, warning: 0.6 },
    errorRate: { critical: 5 },
    priority: 1,
  },

  // Crypto / recovery
  { name: 'OprfEvaluate', latency: { critical: 1, warning: 0.6 }, errorRate: { critical: 5 }, priority: 2 },
  { name: 'SetupRecovery', latency: { critical: 1.5, warning: 0.9 }, errorRate: { critical: 5 }, priority: 2 },
  { name: 'ExecuteRecovery', latency: { critical: 1.5, warning: 0.9 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'GetRecoveryConfig',
    latency: { critical: 1.5, warning: 0.9 },
    errorRate: { critical: 5 },
    priority: 3,
  },
  { name: 'DeleteRecovery', latency: { critical: 1.5, warning: 0.9 }, errorRate: { critical: 5 }, priority: 2 },
  {
    name: 'ReportDecryptionResult',
    latency: { critical: 1.5, warning: 0.9 },
    errorRate: { critical: 5 },
    priority: 3,
  },

  // Seed phrase export — P0 latency + paired security anomaly monitor in security.ts.
  {
    name: 'ExportSeedPhrase',
    latency: { critical: 2, warning: 1 },
    errorRate: { critical: 5 },
    priority: 1,
  },
  {
    name: 'ExportSeedPhraseWithRecovery',
    latency: { critical: 2, warning: 1 },
    errorRate: { critical: 5 },
    priority: 1,
  },
]

function endpointLatencyMonitor(spec: EndpointSpec): MonitorDefinition {
  const id = snakeCase(spec.name)
  const metric = `${APM_METRIC_PREFIX}_${spec.name}`
  const hits = `count:${metric}{${apmFilter}}`
  return {
    id: `privy_embedded_wallet_${id}_latency_p95`,
    name: `P95 latency on ${spec.name}`,
    type: 'query alert',
    query: `${LATENCY_AGGREGATION}(${LATENCY_WINDOW}):${volumeGatedPercentile(`p95:${metric}{${apmFilter}}`, { hits, floor: MIN_REQUESTS_PER_RPC_LATENCY })} > ${spec.latency.critical}`,
    alertBody: `P95 latency on \`${spec.name}\` crossed a latency threshold (warning ${spec.latency.warning}s, critical ${spec.latency.critical}s) over a ${LATENCY_ROLLUP_ADJECTIVE} window within the last ${LATENCY_WINDOW_LABEL}, across at least ${MIN_REQUESTS_PER_RPC_LATENCY} requests. Datadog resolves this P95 below the bucket's slowest request, so at least two slow calls are needed to produce the figure. Buckets under ${MIN_REQUESTS_PER_RPC_LATENCY} requests report no data instead of alerting.${spec.notes ? `\n\n${spec.notes}` : ''}`,
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
  // Rate from the entry web span with 4xx filtered out (webServerErrors), not the handler-span
  // `.errors` metric which counts every thrown error. The web span's own error flag also covers some
  // handled 4xx, so the filter is required. Client errors do not page from here; the only cover for
  // them is the Slack-only 4xx anomaly and 401 spike monitors in errors.ts.
  const resource = webResourceName(spec.name)
  const errors = webServerErrors(`${apmFilter},resource_name:${resource}`)
  const hits = `sum:trace.web.request.hits{${apmFilter},resource_name:${resource}}.as_count()`
  const minRequests = rateDenominatorFloor(spec.errorRate.critical, MIN_REQUESTS_5M)
  const minFailures = minFailuresToAlert(spec.errorRate.critical, minRequests)
  return {
    id: `privy_embedded_wallet_${id}_error_rate`,
    name: `5xx error rate on ${spec.name}`,
    type: 'query alert',
    // `.errors` is only emitted once an error has occurred; when absent the division is
    // null, not zero (as_count() does not zero-fill), so the monitor stays silent via
    // `notifyNoData: false` below (do not flip it to true). The `hits` denominator is
    // floored via clamp_min so a lone 5xx in a low-traffic window cannot trip the rate.
    query: `sum(last_5m):( ${errors} / clamp_min(${hits}, ${minRequests}) ) * 100 > ${spec.errorRate.critical}`,
    alertBody: `5xx (server) error rate on \`${spec.name}\` is above ${spec.errorRate.critical}% over the last 5 minutes. Handled 4xx (auth / origin / validation failures) are excluded and never page from this monitor; client-error spikes are covered only by the Slack-only 4xx anomaly and 401 spike monitors. The rate needs at least ${MIN_WEB_SERVER_ERRORS} server errors in the window, and the denominator is floored at ${minRequests} requests, so one server fault in a quiet window cannot reach ${spec.errorRate.critical}% — it takes at least ${minFailures}.`,
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
