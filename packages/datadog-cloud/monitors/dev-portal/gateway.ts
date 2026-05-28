import { MonitorDefinition } from '../../types'

export const devPortalGatewayMonitors: MonitorDefinition[] = [
  {
    id: 'dev-portal_gateway_proxy_errors',
    name: 'Gateway Proxy Errors on dev-portal',
    type: 'log alert',
    query: 'logs("service:dev-portal message:gateway.proxy.error").index("*").rollup("count").last("10m") > 5',
    alertBody:
      'Gateway proxy errors on dev-portal have exceeded threshold. The app is logging gateway.proxy.error at error level — check url, method, and duration_ms fields for details.',
    recoveryBody: 'Gateway proxy errors on dev-portal have recovered.',
    team: 'dev-portal',
    priority: 2,
    thresholds: { critical: 5 },
    logQuery: 'service:dev-portal',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    onMissingData: 'show_no_data',
    prodOnly: true,
  },
  {
    id: 'dev-portal_gateway_proxy_high_latency',
    name: 'Gateway Proxy High Latency on dev-portal',
    type: 'log alert',
    query:
      'logs("service:dev-portal message:gateway.proxy.complete @duration_ms:>3000").index("*").rollup("count").last("10m") > 10',
    alertBody:
      'Gateway proxy latency on dev-portal is consistently high. More than 10 requests exceeded 3000ms duration in the last 10 minutes.',
    recoveryBody: 'Gateway proxy latency on dev-portal has recovered.',
    team: 'dev-portal',
    priority: 3,
    thresholds: { critical: 10 },
    logQuery: 'service:dev-portal',
    runbookUrl: 'https://www.notion.so/uniswap/dev-portal-runbook',
    readmeUrl: 'https://github.com/Uniswap/universe/tree/main/apps/dev-portal',
    dashboards: [],
    enablePaging: false,
    onMissingData: 'show_no_data',
    prodOnly: true,
  },
]
