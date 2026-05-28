import { settings } from '../../config'
import { MonitorDefinition } from '../../types'

// ALB metrics use name:dev-portal-lb tag, scoped by environment from Pulumi config
const albTagFilter = `name:dev-portal-lb,unienv:${settings.environment}`

export const devPortalErrorMonitors: MonitorDefinition[] = [
  {
    id: 'dev-portal_error_5xx',
    name: '5xx Error Rate on dev-portal',
    type: 'query alert',
    query: `sum(last_5m):sum:aws.applicationelb.httpcode_target_5xx{${albTagFilter}}.as_count() / sum:aws.applicationelb.request_count{${albTagFilter}}.as_count() * 100 > 5`,
    alertBody: '5xx error rate for dev-portal has exceeded 5%.',
    recoveryBody: '5xx error rate for dev-portal has recovered.',
    team: 'dev-portal',
    priority: 2,
    thresholds: { critical: 5, warning: 2 },
    logQuery: 'service:dev-portal status:error',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 15,
  },
  {
    id: 'dev-portal_error_anomaly',
    name: 'Error Count Anomaly on dev-portal',
    type: 'query alert',
    query: `avg(last_4h):anomalies(sum:aws.applicationelb.httpcode_target_5xx{${albTagFilter}}.as_count(), 'agile', 3, direction='above', interval=300, alert_window='last_30m', count_default_zero='true') >= 1`,
    alertBody: 'Anomalous spike in error count detected for dev-portal.',
    recoveryBody: 'Error count anomaly for dev-portal has recovered.',
    team: 'dev-portal',
    priority: 3,
    thresholds: { critical: 1, warning: 0.8 },
    thresholdWindows: {
      triggerWindow: 'last_30m',
      recoveryWindow: 'last_30m',
    },
    logQuery: 'service:dev-portal status:error',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    enablePaging: false,
  },
]
