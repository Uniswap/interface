import { settings } from '../../config'
import { MonitorDefinition } from '../../types'

// ALB metrics use name:dev-portal-lb tag, scoped by environment from Pulumi config
const albTagFilter = `name:dev-portal-lb,unienv:${settings.environment}`

export const devPortalLatencyMonitors: MonitorDefinition[] = [
  {
    id: 'dev-portal_latency_p95',
    name: 'P95 Latency on dev-portal',
    type: 'query alert',
    query: `avg(last_5m):avg:aws.applicationelb.target_response_time.p95{${albTagFilter}} > 2`,
    alertBody: 'P95 latency for dev-portal has exceeded 2 seconds.',
    recoveryBody: 'P95 latency for dev-portal has recovered.',
    team: 'dev-portal',
    priority: 3,
    thresholds: { critical: 2, warning: 1.5 },
    logQuery: 'service:dev-portal',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 15,
  },
  {
    id: 'dev-portal_latency_p99',
    name: 'P99 Latency on dev-portal',
    type: 'query alert',
    query: `avg(last_5m):avg:aws.applicationelb.target_response_time.p99{${albTagFilter}} > 5`,
    alertBody: 'P99 latency for dev-portal has exceeded 5 seconds.',
    recoveryBody: 'P99 latency for dev-portal has recovered.',
    team: 'dev-portal',
    priority: 2,
    thresholds: { critical: 5, warning: 3 },
    logQuery: 'service:dev-portal',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 15,
  },
]
