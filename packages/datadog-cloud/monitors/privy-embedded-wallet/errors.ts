import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import {
  MIN_ALB_REQUESTS_5M,
  MIN_REQUESTS_5M,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  albTagFilter,
  apmTagFilter,
  rateDenominatorFloor,
} from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)
const apmFilter = apmTagFilter(env)

// Volume floors for the two service-wide error-rate monitors below. The 5 matches their > 5
// (5%) query threshold: the floor is the smallest request count at which one 5xx stays under it.
const albErrorFloor = rateDenominatorFloor(5, MIN_ALB_REQUESTS_5M)
const apmErrorFloor = rateDenominatorFloor(5, MIN_REQUESTS_5M)

export const privyEmbeddedWalletErrorMonitors: MonitorDefinition[] = [
  {
    id: 'privy_embedded_wallet_5xx_error_rate',
    name: '5xx error rate on privy-embedded-wallet',
    type: 'query alert',
    query: `sum(last_5m):( sum:aws.applicationelb.httpcode_target_5xx{${albFilter}}.as_count() / clamp_min(sum:aws.applicationelb.request_count{${albFilter}}.as_count(), ${albErrorFloor}) ) * 100 > 5`,
    alertBody: `Target 5xx error rate for privy-embedded-wallet ALB is above 5% over the last 5 minutes. This means the service itself is returning errors to clients. Requires at least ${albErrorFloor} requests in the window before the rate can alert.`,
    recoveryBody: '5xx error rate has recovered below threshold.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 5, warning: 2 },
    logQuery: 'service:privy-embedded-wallet status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
  {
    id: 'privy_embedded_wallet_4xx_anomaly',
    name: '4xx anomaly on privy-embedded-wallet',
    type: 'query alert',
    query: `avg(last_15m):anomalies(sum:aws.applicationelb.httpcode_target_4xx{${albFilter}}.as_count(), 'agile', 3, direction='above', interval=60, alert_window='last_15m', count_default_zero='true', seasonality='hourly') >= 1`,
    alertBody:
      'Abnormal spike in 4xx responses on the privy-embedded-wallet ALB. Common causes: malformed client requests, auth/session failures, CORS rejections, or partial outage in a downstream client.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 1 },
    thresholdWindows: {
      triggerWindow: 'last_15m',
      recoveryWindow: 'last_15m',
    },
    logQuery: 'service:privy-embedded-wallet @http.status_code:[400 TO 499]',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // 4xx is noisy at low volume — turn off paging, Slack-only signal.
    enablePaging: false,
    includeIncidentWebhook: false,
  },
  {
    // APM-side aggregate error rate as a cross-check on the ALB signal. APM counts
    // application-thrown errors (status:error spans) which may differ from 5xx if
    // the framework masks errors as 2xx or vice versa.
    id: 'privy_embedded_wallet_apm_error_rate',
    name: 'APM error rate on privy-embedded-wallet (aggregate)',
    type: 'query alert',
    query: `sum(last_5m):( sum:trace.web.request.errors{${apmFilter}}.as_count() / clamp_min(sum:trace.web.request.hits{${apmFilter}}.as_count(), ${apmErrorFloor}) ) * 100 > 5`,
    alertBody: `Service-wide application error rate on privy-embedded-wallet is above 5% over the last 5 minutes. Investigate per-endpoint breakdown via the service dashboard. Requires at least ${apmErrorFloor} requests in the window before the rate can alert.`,
    team: TEAM,
    priority: 2,
    thresholds: { critical: 5, warning: 2 },
    logQuery: 'service:privy-embedded-wallet status:error',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
]
