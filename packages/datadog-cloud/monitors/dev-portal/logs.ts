import { MonitorDefinition } from '../../types'

export const devPortalLogMonitors: MonitorDefinition[] = [
  {
    id: 'dev-portal_log_error_spike',
    name: 'Error Log Spike on dev-portal',
    type: 'log alert',
    query: 'logs("service:dev-portal level:error").index("*").rollup("count").last("15m") > 50',
    alertBody: 'Error-level log volume for dev-portal has exceeded 50 in the last 15 minutes.',
    recoveryBody: 'Error-level log volume for dev-portal has recovered to normal levels.',
    team: 'dev-portal',
    priority: 2,
    thresholds: { critical: 50 },
    logQuery: 'service:dev-portal level:error',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    enablePaging: false,
    onMissingData: 'show_no_data',
    prodOnly: true,
  },
]
