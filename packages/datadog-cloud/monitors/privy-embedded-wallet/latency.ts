import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import {
  MIN_ALB_REQUESTS_5M,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  albTagFilter,
  apmTagFilter,
} from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)
const apmFilter = apmTagFilter(env)

// Whole-service web-request count, used to volume-gate the aggregate p95 below.
const apmHits = `sum:trace.web.request.hits{${apmFilter}}.as_count()`

// Whole-service ALB request count, used to volume-gate the ALB p95 below (same idiom
// as the APM aggregate p95 and the ALB/APM error-rate monitors in errors.ts).
const albHits = `sum:aws.applicationelb.request_count{${albFilter}}.as_count()`

export const privyEmbeddedWalletLatencyMonitors: MonitorDefinition[] = [
  {
    id: 'privy_embedded_wallet_latency_p95',
    name: 'P95 Latency on privy-embedded-wallet',
    type: 'query alert',
    // Volume-gate: scale p95 by (hits / clamp_min(hits, floor)) so a single slow request
    // in a low-traffic window (prod ALB sees as few as 2-20 req/min) can't dominate the
    // 1-minute p95 bucket and page on its own. Same idiom as the APM aggregate p95 below.
    query: `avg(last_5m):( avg:aws.applicationelb.target_response_time.p95{${albFilter}} * ${albHits} / clamp_min(${albHits}, ${MIN_ALB_REQUESTS_5M}) ) > 2`,
    alertBody: `P95 ALB target response time for privy-embedded-wallet has exceeded 2 seconds. Requires at least ${MIN_ALB_REQUESTS_5M} requests in the window before it can alert.`,
    recoveryBody: 'P95 ALB target response time for privy-embedded-wallet has recovered.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 2, warning: 1.5 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 30,
  },
  {
    id: 'privy_embedded_wallet_latency_p99',
    name: 'P99 Latency on privy-embedded-wallet',
    type: 'query alert',
    query: `avg(last_5m):avg:aws.applicationelb.target_response_time.p99{${albFilter}} > 5`,
    alertBody: 'P99 ALB target response time for privy-embedded-wallet has exceeded 5 seconds.',
    recoveryBody: 'P99 ALB target response time for privy-embedded-wallet has recovered.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 5, warning: 3 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 30,
  },
  {
    // Aggregate APM-side latency. ALB latency is the user-perceived signal; this is
    // the application-side signal that excludes network/AWS overhead and gives us a
    // cleaner read on service health when ALB latency is degraded.
    id: 'privy_embedded_wallet_apm_p95_aggregate',
    name: 'APM P95 latency on privy-embedded-wallet (aggregate)',
    type: 'query alert',
    // Volume-gate the p95 (same gate as the per-endpoint latency monitors) so a single
    // slow request in a low-traffic window can't trip the aggregate.
    query: `avg(last_5m):( p95:trace.web.request{${apmFilter}} * ${apmHits} / clamp_min(${apmHits}, ${MIN_ALB_REQUESTS_5M}) ) > 1.5`,
    alertBody: `Service-wide P95 application latency for privy-embedded-wallet has exceeded 1.5s. Investigate per-endpoint breakdown via the service dashboard. Requires at least ${MIN_ALB_REQUESTS_5M} requests in the window before it can alert.`,
    recoveryBody: 'APM P95 latency has recovered.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 1.5, warning: 1 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
]
