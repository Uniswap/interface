import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { PRIVY_EMBEDDED_WALLET_RUNBOOK, SERVICE_README_URL, TEAM, albTagFilter } from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)

export const privyEmbeddedWalletAvailabilityMonitors: MonitorDefinition[] = [
  {
    // Detect traffic falling well below its learned seasonal baseline ("approaching
    // zero at a 9 rate"), rather than an absolute `< 1` floor that false-fires on
    // every idle window for a low-volume service. `count_default_zero='true'` folds
    // routine quiet periods into the baseline so they are not alerts; missing data is
    // therefore handled by the anomaly math (no `onMissingData` no-data paging, which
    // was itself part of the false-alarm behavior).
    id: 'privy_embedded_wallet_zero_traffic',
    name: 'Traffic dropped below baseline on privy-embedded-wallet',
    type: 'query alert',
    query: `avg(last_30m):anomalies(sum:aws.applicationelb.request_count{${albFilter}}.as_count(), 'agile', 2, direction='below', interval=600, alert_window='last_30m', count_default_zero='true', seasonality='daily') >= 1`,
    alertBody:
      'Traffic to the privy-embedded-wallet ALB has fallen well below its expected baseline. This likely indicates a routing, DNS, or client-side problem rather than a service fault — but it warrants investigation.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 1 },
    thresholdWindows: {
      triggerWindow: 'last_30m',
      recoveryWindow: 'last_15m',
    },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Observe-only until the seasonal baseline matures. Real sustained prod traffic
    // only began ~2026-06-02, so the learned band is unreliable today and (like the
    // 4xx anomaly) traffic anomalies are noisy at low volume. The 1h no-traffic floor
    // below provides paging coverage in the meantime. Flip paging back on once the
    // baseline is trustworthy (~3 weeks post-launch).
    enablePaging: false,
    includeIncidentWebhook: false,
  },
  {
    // Absolute safety net: a full hour with zero ALB requests is a real outage signal
    // even before the anomaly baseline above matures. A 1h window (vs the old 10m)
    // is long enough that genuine quiet periods don't trip it once traffic has ramped.
    id: 'privy_embedded_wallet_no_traffic_floor',
    name: 'No traffic for 1h on privy-embedded-wallet',
    type: 'query alert',
    query: `sum(last_1h):sum:aws.applicationelb.request_count{${albFilter}}.as_count() < 1`,
    alertBody:
      'No requests have reached the privy-embedded-wallet ALB for a full hour. This likely indicates a routing, DNS, or client-side outage rather than a service problem — but it warrants investigation.',
    recoveryBody: 'Traffic has resumed on the privy-embedded-wallet ALB.',
    team: TEAM,
    priority: 2,
    // For `< 1` queries, DD requires criticalRecovery > critical. Recover at 2 so a
    // single straggler request doesn't flap the monitor.
    thresholds: { critical: 1, criticalRecovery: 2 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // A full hour of no data on the ALB is itself a real outage — surface it.
    onMissingData: 'show_and_notify_no_data',
  },
  {
    id: 'privy_embedded_wallet_no_healthy_hosts',
    name: 'No healthy hosts on privy-embedded-wallet',
    type: 'query alert',
    query: `min(last_5m):min:aws.applicationelb.healthy_host_count{${albFilter}} < 1`,
    alertBody:
      'The privy-embedded-wallet target group has no healthy hosts. All ALB-routed requests will fail until at least one task becomes healthy.',
    recoveryBody: 'Healthy hosts have recovered.',
    team: TEAM,
    priority: 1,
    // For `< 1` queries, DD requires criticalRecovery > critical. Recovery at 2
    // means we wait for at least 2 healthy hosts before clearing — guards against
    // flapping when a single replacement task is still passing its first health check.
    thresholds: { critical: 1, criticalRecovery: 2 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 15,
  },
]
