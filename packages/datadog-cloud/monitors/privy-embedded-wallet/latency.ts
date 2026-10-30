import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import {
  LATENCY_AGGREGATION,
  LATENCY_ROLLUP_ADJECTIVE,
  LATENCY_ROLLUP_LABEL,
  LATENCY_WINDOW,
  LATENCY_WINDOW_LABEL,
  MIN_REQUESTS_AGGREGATE_LATENCY,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  albTagFilter,
  apmTagFilter,
  volumeGatedPercentile,
} from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)
const apmFilter = apmTagFilter(env)

// Whole-service request counts, used to volume-gate the aggregate p95s below.
const apmHits = `sum:trace.web.request.hits{${apmFilter}}`

const albHits = `sum:aws.applicationelb.request_count{${albFilter}}`

// Warnings sit ~1.2-1.3x above the 30-day prod baseline maximum (2026-07-18..08-17, incident
// excluded), criticals ~2x or more. Alert copy names both: one body serves warn and alert.
const albP95Thresholds = { critical: 2, warning: 0.6 }

const apmAggregateThresholds = { critical: 1.5, warning: 1 }

export const privyEmbeddedWalletLatencyMonitors: MonitorDefinition[] = [
  {
    id: 'privy_embedded_wallet_latency_p95',
    name: 'P95 Latency on privy-embedded-wallet',
    type: 'query alert',
    query: `${LATENCY_AGGREGATION}(${LATENCY_WINDOW}):${volumeGatedPercentile(`avg:aws.applicationelb.target_response_time.p95{${albFilter}}`, { hits: albHits, floor: MIN_REQUESTS_AGGREGATE_LATENCY })} > ${albP95Thresholds.critical}`,
    alertBody: `ALB target response time for privy-embedded-wallet crossed a latency threshold (warning ${albP95Thresholds.warning}s, critical ${albP95Thresholds.critical}s) over a ${LATENCY_ROLLUP_ADJECTIVE} window within the last ${LATENCY_WINDOW_LABEL}, across at least ${MIN_REQUESTS_AGGREGATE_LATENCY} requests. CloudWatch publishes this percentile per minute, so the figure is the mean of the ALB's per-minute P95s over the window, not a true ${LATENCY_ROLLUP_LABEL} P95 — read it as "the typical P95 was elevated for ${LATENCY_ROLLUP_LABEL}".`,
    recoveryBody: 'P95 ALB target response time for privy-embedded-wallet has recovered.',
    team: TEAM,
    priority: 3,
    thresholds: albP95Thresholds,
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // No-data below the request floor means "too quiet to judge", not an outage; traffic loss is
    // owned by privy_embedded_wallet_zero_traffic and privy_embedded_wallet_no_traffic_floor.
    notifyNoData: false,
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
    query: `${LATENCY_AGGREGATION}(${LATENCY_WINDOW}):${volumeGatedPercentile(`p95:trace.web.request{${apmFilter}}`, { hits: apmHits, floor: MIN_REQUESTS_AGGREGATE_LATENCY })} > ${apmAggregateThresholds.critical}`,
    alertBody: `Service-wide P95 application latency for privy-embedded-wallet crossed a latency threshold (warning ${apmAggregateThresholds.warning}s, critical ${apmAggregateThresholds.critical}s) over a ${LATENCY_ROLLUP_ADJECTIVE} window within the last ${LATENCY_WINDOW_LABEL}, across at least ${MIN_REQUESTS_AGGREGATE_LATENCY} requests. This is a true ${LATENCY_ROLLUP_LABEL} P95 (the trace metric is a distribution, so Datadog merges the sketches over the window). Investigate per-endpoint breakdown via the service dashboard.`,
    recoveryBody: 'APM P95 latency has recovered.',
    team: TEAM,
    priority: 3,
    thresholds: apmAggregateThresholds,
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
]
