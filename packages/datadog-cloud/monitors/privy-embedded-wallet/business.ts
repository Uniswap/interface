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
 * Business-funnel monitors. These watch the success rate of user-visible flows
 * rather than raw error counts. A drop in success rate is a leading indicator
 * even when individual endpoints look healthy (e.g. a partial Privy outage may
 * not cause errors, just timeouts that the client masks).
 */
interface SuccessRateMonitor {
  endpoint: string
  /** Minimum acceptable success rate, percent (0-100). Below = critical. */
  threshold: number
  priority: 1 | 2 | 3 | 4 | 5
  rationale: string
  /**
   * Count only 5xx server faults (via the entry web span), excluding handled 4xx. Use for
   * funnels where routine user-driven 4xx (failed passkey auth, "no wallet found" for a new
   * credential, or a 429 from per-IP rate limiting) would otherwise depress the rate and page
   * on-call. Defaults to false: handler-span `.errors`, which counts any thrown error
   * including 4xx.
   */
  serverFaultsOnly?: boolean
}

const successRateMonitors: SuccessRateMonitor[] = [
  {
    endpoint: 'WalletSignIn',
    threshold: 95,
    priority: 2,
    // 5xx-only: 4xx here are routine (a failed passkey assertion, or a new credential
    // with no wallet yet), so counting them depressed the funnel and paged on-call.
    serverFaultsOnly: true,
    rationale:
      'Wallet sign-in is the primary auth flow. Tracks the server-fault (5xx) rate only; handled 4xx (a failed passkey assertion, or "no wallet found" for a brand-new credential, which is routine) are excluded so this reflects backend health, not user auth outcomes. Below 95% over 30 minutes means more than 5% of sign-in requests are returning 5xx.',
  },
  {
    endpoint: 'CreateWallet',
    threshold: 90,
    priority: 1,
    serverFaultsOnly: true,
    rationale:
      'Wallet creation drives every downstream metric (signing, recovery, etc). Tracks the server-fault (5xx) rate only; handled 4xx (failed/absent auth including unauthenticated bot traffic, or a 429 from per-IP rate limiting) are excluded so this reflects backend health, not client auth outcomes. Below 90% over 30 minutes means more than 10% of requests are returning 5xx.',
  },
  {
    endpoint: 'Challenge',
    threshold: 99,
    priority: 1,
    serverFaultsOnly: true,
    rationale:
      'Challenge is the canary called before nearly every other endpoint. Tracks the server-fault (5xx) rate only; handled 4xx (permission_denied for disallowed/spoofed origins, or a 429 from per-IP rate limiting, both correct rejection behavior) are excluded. A 5xx drop here indicates a service-wide problem (CORS misconfig, ALB routing, Redis outage) since the Challenge handler itself is simple.',
  },
]

function successRateAlert(spec: SuccessRateMonitor): MonitorDefinition {
  const id = snakeCase(spec.endpoint)
  // Failure basis: serverFaultsOnly -> entry web-span 5xx only; default -> handler-span
  // `.errors` (any thrown error, incl. 4xx). See SuccessRateMonitor.serverFaultsOnly.
  const handlerMetric = `${APM_METRIC_PREFIX}_${spec.endpoint}`
  const webFilter = `${apmFilter},resource_name:${webResourceName(spec.endpoint)}`
  const hits = spec.serverFaultsOnly
    ? `sum:trace.web.request.hits{${webFilter}}.as_count()`
    : `sum:${handlerMetric}.hits{${apmFilter}}.as_count()`
  const errors = spec.serverFaultsOnly
    ? `sum:trace.web.request.errors{${webFilter}}.as_count()`
    : `sum:${handlerMetric}.errors{${apmFilter}}.as_count()`
  const minRequests = rateDenominatorFloor(100 - spec.threshold, MIN_REQUESTS_5M)
  return {
    id: `privy_embedded_wallet_${id}_success_rate`,
    name: `${spec.endpoint} success rate below ${spec.threshold}%`,
    type: 'query alert',
    // Success rate as 100 - failureRate; failureRate floors its denominator via clamp_min (same
    // volume gate as the 5xx monitors), so below minRequests a lone failure stays under threshold.
    // 30m window for slow degradation, vs the 5m acute-spike endpoint monitor.
    query: `sum(last_30m):( 100 - ( ${errors} / clamp_min(${hits}, ${minRequests}) ) * 100 ) < ${spec.threshold}`,
    alertBody: `\`${spec.endpoint}\` success rate dropped below ${spec.threshold}% over the last 30 minutes. Requires at least ${minRequests} requests in the window before it can alert.\n\n${spec.rationale}`,
    recoveryBody: `\`${spec.endpoint}\` success rate has recovered.`,
    team: TEAM,
    priority: spec.priority,
    thresholds: { critical: spec.threshold, criticalRecovery: spec.threshold + 1 },
    logQuery: `service:privy-embedded-wallet @resource_name:"uniswap.privyembeddedwallet.v1.EmbeddedWalletService:${spec.endpoint}"`,
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Below-threshold alerts on a ratio query benefit from a small evaluation
    // delay to avoid firing on partial metric ingestion windows.
    evaluationDelay: 60,
    notifyNoData: false,
  }
}

export const privyEmbeddedWalletBusinessMonitors: MonitorDefinition[] = successRateMonitors.map(successRateAlert)
