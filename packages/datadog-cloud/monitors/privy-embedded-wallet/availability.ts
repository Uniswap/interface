import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { PRIVY_EMBEDDED_WALLET_RUNBOOK, SERVICE_README_URL, TEAM, albTagFilter } from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)

export const privyEmbeddedWalletAvailabilityMonitors: MonitorDefinition[] = [
  {
    id: 'privy_embedded_wallet_zero_traffic',
    name: 'Zero traffic on privy-embedded-wallet',
    type: 'query alert',
    query: `sum(last_10m):sum:aws.applicationelb.request_count{${albFilter}}.as_count() < 1`,
    alertBody:
      'No traffic has reached the privy-embedded-wallet ALB in the last 10 minutes. This likely indicates a routing, DNS, or client-side outage rather than a service problem — but it warrants investigation.',
    recoveryBody: 'Traffic has resumed on the privy-embedded-wallet ALB.',
    team: TEAM,
    priority: 2,
    // For `< 1` queries, DD requires criticalRecovery > critical. Setting recovery
    // to 2 means: alert when request_count drops to 0; recover when traffic has
    // climbed back to at least 2 requests in the window (small margin so we don't
    // flap on a single straggler request).
    thresholds: { critical: 1, criticalRecovery: 2 },
    logQuery: 'service:privy-embedded-wallet',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Surface as alert state when data stops arriving (not just when below threshold).
    // The DD provider rejects setting both `onMissingData` and the legacy
    // `notifyNoData`/`noDataTimeframe` fields — `onMissingData` supersedes them.
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
