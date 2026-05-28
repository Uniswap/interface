import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { snakeCase } from '../../util'
import { APM_METRIC_PREFIX, PRIVY_EMBEDDED_WALLET_RUNBOOK, SERVICE_README_URL, TEAM, apmTagFilter } from './constants'

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
}

const successRateMonitors: SuccessRateMonitor[] = [
  {
    endpoint: 'WalletSignIn',
    threshold: 95,
    priority: 2,
    rationale:
      'Wallet sign-in is the primary auth flow. Below 95% over 30 minutes means a meaningful share of users cannot access their wallet.',
  },
  {
    endpoint: 'CreateWallet',
    threshold: 90,
    priority: 1,
    rationale:
      'Wallet creation drives every downstream metric (signing, recovery, etc). Failures here are the most expensive — they prevent any future activation.',
  },
  {
    endpoint: 'Challenge',
    threshold: 99,
    priority: 1,
    rationale:
      'Challenge is the canary called before nearly every other endpoint. A drop below 99% indicates a service-wide problem (CORS, ALB routing, Redis outage) since the Challenge handler itself is simple.',
  },
]

function successRateAlert(spec: SuccessRateMonitor): MonitorDefinition {
  const id = snakeCase(spec.endpoint)
  const metric = `${APM_METRIC_PREFIX}_${spec.endpoint}`
  return {
    id: `privy_embedded_wallet_${id}_success_rate`,
    name: `${spec.endpoint} success rate below ${spec.threshold}%`,
    type: 'query alert',
    // Success rate = (hits - errors) / hits * 100. We trigger when that drops
    // below the threshold over a 30-minute window. Longer window than the per-
    // endpoint error monitor in endpoints.ts (5m) — this signal is meant to
    // catch slow degradation, not acute spikes.
    query: `sum(last_30m):( ( sum:${metric}.hits{${apmFilter}}.as_count() - sum:${metric}.errors{${apmFilter}}.as_count() ) / sum:${metric}.hits{${apmFilter}}.as_count() ) * 100 < ${spec.threshold}`,
    alertBody: `\`${spec.endpoint}\` success rate dropped below ${spec.threshold}% over the last 30 minutes.\n\n${spec.rationale}`,
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
