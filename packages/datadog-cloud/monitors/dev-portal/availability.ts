import { settings } from '../../config'
import { MonitorDefinition } from '../../types'

// ALB metrics use name:dev-portal-lb tag, scoped by environment from Pulumi config
const albTagFilter = `name:dev-portal-lb,unienv:${settings.environment}`

export const devPortalAvailabilityMonitors: MonitorDefinition[] = [
  {
    id: 'dev-portal_availability_zero_traffic',
    name: 'Zero Traffic on dev-portal',
    type: 'query alert',
    query: `sum(last_10m):sum:aws.applicationelb.request_count{${albTagFilter}}.as_count() == 0`,
    alertBody: 'dev-portal is receiving zero traffic. Service may be down.',
    recoveryBody: 'dev-portal is receiving traffic again.',
    team: 'dev-portal',
    priority: 1,
    thresholds: { critical: 0 },
    noDataTimeframe: 15,
    notifyNoData: true,
    logQuery: 'service:dev-portal',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
  },
  {
    id: 'dev-portal_availability_success_rate',
    name: 'Success Rate on dev-portal',
    type: 'query alert',
    query: `sum(last_5m):(1 - sum:aws.applicationelb.httpcode_target_5xx{${albTagFilter}}.as_count() / sum:aws.applicationelb.request_count{${albTagFilter}}.as_count()) * 100 < 99`,
    alertBody: 'Success rate for dev-portal has dropped below 99%.',
    recoveryBody: 'Success rate for dev-portal has recovered above 99%.',
    team: 'dev-portal',
    priority: 2,
    thresholds: { critical: 99, warning: 99.5 },
    logQuery: 'service:dev-portal status:error',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 15,
  },
]
