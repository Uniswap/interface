import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import {
  MIN_ALB_REQUESTS_5M,
  MIN_REQUESTS_5M,
  MIN_WEB_SERVER_ERRORS,
  PRIVY_EMBEDDED_WALLET_RUNBOOK,
  SERVICE_README_URL,
  TEAM,
  albTagFilter,
  apmTagFilter,
  minFailuresToAlert,
  rateDenominatorFloor,
  webServerErrors,
} from './constants'

const env = settings.environment
const albFilter = albTagFilter(env)
const apmFilter = apmTagFilter(env)

// Volume floors for the two service-wide error-rate monitors below. The 5 matches their > 5
// (5%) query threshold: the floor is the smallest request count at which one 5xx stays under it.
const albErrorFloor = rateDenominatorFloor(5, MIN_ALB_REQUESTS_5M)
const apmErrorFloor = rateDenominatorFloor(5, MIN_REQUESTS_5M)
const apmErrorMinFailures = Math.max(minFailuresToAlert(5, apmErrorFloor), MIN_WEB_SERVER_ERRORS)

// Highest organic 401 count seen in any single 15m window over a trailing 30 days, measured on
// the same metric and window the monitor evaluates. Recorded because the threshold below is
// derived from it, so a future re-tune can tell whether traffic moved or the threshold drifted.
const AUTH_FAILURE_15M_ORGANIC_PEAK = 25

// Set immediately above the organic peak: a 30d backtest over every 15m window put >25 at zero
// firings, while the >15 first suggested in review would have fired 7 times on ordinary sign-in
// traffic (>10: 21, >20: 2). A real spray produces 401s far above the ~31/day organic total, so
// the blind spot this leaves is narrow.
const AUTH_FAILURE_15M_THRESHOLD = AUTH_FAILURE_15M_ORGANIC_PEAK

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
    // Authentication-failure (401) spike — credential-stuffing / passkey-spraying signal.
    // Scoped to 401 specifically, unlike the aggregate `4xx_anomaly` above: service 4xx is
    // dominated by Challenge 400/429 (validation + rate-limiting), so a 401 spray would be
    // diluted there. 401 is overwhelmingly a failed WalletSignIn passkey assertion. The
    // inbound by_http_status metric tags resource_name by HTTP method only (post/patch), so
    // this is service-wide rather than per-endpoint — acceptable since 401 ~= sign-in.
    // Metric-based, not a log alert: this service ships no indexed logs (a log alert would
    // silently no-op).
    id: 'privy_embedded_wallet_auth_failure_spike',
    name: '401 authentication-failure spike on privy-embedded-wallet',
    type: 'query alert',
    // Static count, not an anomaly band. 401 sits at ~0 for the overwhelming majority of
    // windows (30d: 943 total 401s across only 191 non-empty 15m windows, 0.05% of 1.7M
    // requests), and against a near-zero baseline an agile band collapses to near-zero width
    // — degenerating into "any sustained non-zero is anomalous". A flat count is predictable
    // and carries its own floor.
    query: `sum(last_15m):sum:trace.http.request.hits.by_http_status{${apmFilter},http.status_code:401}.as_count() > ${AUTH_FAILURE_15M_THRESHOLD}`,
    alertBody: `More than ${AUTH_FAILURE_15M_THRESHOLD} HTTP 401 (authentication-failure) responses on privy-embedded-wallet in 15 minutes. 401s are predominantly failed WalletSignIn passkey assertions, so a burst is a credential-stuffing / passkey-spraying signal. Organic traffic peaked at ${AUTH_FAILURE_15M_ORGANIC_PEAK} in a 15m window over the trailing 30 days, so this fires only above anything sign-in traffic has produced on its own.\n\nInvestigate (APM trace search for the spike window — this service has no indexed logs): is one client_ip driving the 401s, and is there a correlated spike on Challenge / OprfEvaluate suggesting coordinated abuse? Cross-ref APPS-9784.`,
    recoveryBody: '401 authentication-failure volume has returned to baseline.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: AUTH_FAILURE_15M_THRESHOLD },
    logQuery: 'service:privy-embedded-wallet @http.status_code:401',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // Abuse signal, not an availability one — Slack-only, no page.
    enablePaging: false,
    includeIncidentWebhook: false,
    // 401 is absent from ~93% of 15m windows; no-data is the normal state here,
    // not a fault. Matches Datadog's own default, but both siblings state it
    // explicitly so the silence is documented rather than inherited.
    notifyNoData: false,
  },
  {
    // APM-side aggregate error rate as a cross-check on the ALB signal. APM counts
    // error-flagged web spans minus handled 4xx, which may differ from 5xx if the
    // framework masks errors as 2xx.
    id: 'privy_embedded_wallet_apm_error_rate',
    name: 'APM error rate on privy-embedded-wallet (aggregate)',
    type: 'query alert',
    query: `sum(last_5m):( ${webServerErrors(apmFilter)} / clamp_min(sum:trace.web.request.hits{${apmFilter}}.as_count(), ${apmErrorFloor}) ) * 100 > 5`,
    alertBody: `Service-wide server-side error rate on privy-embedded-wallet (handled 4xx excluded; they do not page from this monitor) is above 5% over the last 5 minutes. Investigate per-endpoint breakdown via the service dashboard. The rate needs at least ${MIN_WEB_SERVER_ERRORS} server errors in the window and the denominator is floored at ${apmErrorFloor} requests, so it takes at least ${apmErrorMinFailures} server errors to cross 5%.`,
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
