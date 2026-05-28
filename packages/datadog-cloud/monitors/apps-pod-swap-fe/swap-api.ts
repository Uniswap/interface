import { MonitorDefinition } from '../../types'
import { SWAP_FE_ADDITIONAL_SLACK_CHANNELS, SWAP_POD_RUNBOOK, TEAM, UNIVERSE_REPO_URL } from './constants'

/**
 * Monitors for swap/quote API reliability across web, wallet/mobile/extension.
 *
 * Ported from UI-managed monitors:
 *   - 229892747 [Web] Elevated RPC failures (query alert)
 *   - 154241218 [Mobile] Unknown gas simulation Error rate (query alert)
 *   - 228640457 [Web] General API failure for Swap + Quote endpoints (rum alert)
 *   - 230868444 [Wallet] General API failure for Swap + Quote endpoints (rum alert)
 */
export const swapFeApiMonitors: MonitorDefinition[] = [
  {
    id: 'swap_fe_web_rpc_failures_anomaly',
    name: '[Web] Elevated RPC failures',
    type: 'query alert',
    query:
      "avg(last_15m):anomalies(sum:web.rpc_error{*}.as_count(), 'agile', 2, direction='both', interval=60, alert_window='last_15m', count_default_zero='true', seasonality='hourly') >= 1",
    alertBody: 'Elevated RPC failures detected on web (anomaly detection).',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 1 },
    thresholdWindows: {
      triggerWindow: 'last_15m',
      recoveryWindow: 'last_15m',
    },
    logQuery: 'service:web-prod',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
    // Slack-only: this per-attempt signal is useful for provider degradation trends,
    // but it is too noisy to page on because fallback recovery can hide user impact.
    enablePaging: false,
    includeIncidentWebhook: false,
  },
  {
    id: 'swap_fe_web_rpc_providers_exhausted_user_impact',
    name: '[Web] RPC providers exhausted (user impact)',
    type: 'rum alert',
    query: 'formula("cutoff_min(query1, 20) / query").last("4h") > 0.005',
    alertBody:
      'At least 0.5% of web sessions, with a minimum floor of 20 distinct sessions, hit `All providers failed to perform the operation`. This means every RPC fallback failed for a user-visible call.',
    recoveryBody: 'Web RPC provider exhaustion has recovered below the user-impact threshold.',
    team: TEAM,
    priority: 2,
    thresholds: {
      critical: 0.005,
      criticalRecovery: 0.0025,
    },
    logQuery: 'service:web-prod "All providers failed to perform the operation"',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
    enablePaging: true,
    includeIncidentWebhook: true,
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:error env:(production OR prod) service:web-prod @error.message:"All providers failed to perform the operation"',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: 'env:(production OR prod) service:web-prod',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
      ],
    },
  },
  {
    id: 'swap_fe_mobile_unknown_gas_sim_error_rate',
    name: '[Mobile] Unknown gas simulation Error rate',
    type: 'query alert',
    query:
      'sum(last_3h):sum:mobile.unknown_gas_sim_safe_tokens_by_chain_name{*}.as_count() / avg:mobile.quote_http_requests{*}.as_count() * 100 > 2.5',
    alertBody:
      'More than 2.5% of quote requests are returning `Unknown gas simulation error` for tokens with no safety warnings.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 2.5 },
    logQuery: 'service:mobile',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/mobile`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
  },
  {
    id: 'swap_fe_web_api_failure_swap_quote',
    name: '[Web] General API failure for Swap + Quote endpoints',
    type: 'rum alert',
    query: 'formula("query / query1 * 100").last("2h") > 40',
    alertBody:
      'Sustained API failure rate detected on Swap/Quote endpoints (web). Raise issue in #pod-swap with endpoint affected.',
    team: TEAM,
    priority: 2,
    thresholds: {
      critical: 40,
      warning: 25,
      criticalRecovery: 20,
      warningRecovery: 20,
    },
    newGroupDelay: 60,
    logQuery: 'service:web-prod',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
    variables: {
      eventQueries: [
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:web-prod @resource.status_code:(>=400 !404) @resource.url_path:(/v1/quote OR /v1/swap OR /v2/quote OR /v1/swap_5792)',
          },
          computes: [{ aggregation: 'count' }],
          groupBies: [
            {
              facet: '@resource.url_path',
              limit: 10,
              sort: { aggregation: 'count', order: 'desc' },
            },
          ],
        },
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:web-prod @resource.url_path:(/v1/quote OR /v1/swap OR /v2/quote OR /v1/swap_5792)',
          },
          computes: [{ aggregation: 'count' }],
          groupBies: [
            {
              facet: '@resource.url_path',
              limit: 10,
              sort: { aggregation: 'count', order: 'desc' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'swap_fe_wallet_api_failure_swap_quote',
    name: '[Wallet] General API failure for Swap + Quote endpoints',
    type: 'rum alert',
    // `cutoff_min(query1, 25)` enforces a minimum of 25 sessions per
    // (`@resource.url_path`, `@service`) bucket before the ratio is evaluated.
    // Without this floor, low-traffic buckets (e.g. extension `/v1/swap` with
    // <10 sessions/4h) can trip the warn from a single user retrying a failed
    // request. Matches the floor pattern used by
    // `swap_fe_web_rpc_providers_exhausted_user_impact` in this file.
    query: 'formula("query / cutoff_min(query1, 25) * 100").last("4h") > 50',
    alertBody:
      'Sustained API failure rate detected on Swap/Quote endpoints (wallet — mobile + extension). Raise issue in #pod-swap with endpoint affected.',
    team: TEAM,
    priority: 2,
    thresholds: {
      critical: 50,
      warning: 30,
      criticalRecovery: 0.2,
      warningRecovery: 0.2,
    },
    newGroupDelay: 60,
    logQuery: 'service:(com.uniswap.mobile OR extension-prod)',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/packages/wallet`,
    dashboards: [],
    additionalSlackChannels: SWAP_FE_ADDITIONAL_SLACK_CHANNELS,
    variables: {
      eventQueries: [
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:(com.uniswap.mobile OR extension-prod) @resource.status_code:>=400 !@resource.status_code:404 @resource.url_path:(/v1/quote OR /v1/swap OR /v2/quote OR /v1/swap_5792 OR /v1/swap_7702)',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
          groupBies: [
            {
              facet: '@resource.url_path',
              limit: 10,
              sort: { aggregation: 'cardinality', metric: '@session.id', order: 'desc' },
            },
            {
              facet: '@service',
              limit: 10,
              sort: { aggregation: 'cardinality', metric: '@session.id', order: 'desc' },
            },
          ],
        },
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:(com.uniswap.mobile OR extension-prod) @resource.url_path:(/v1/quote OR /v1/swap OR /v2/quote OR /v1/swap_5792 OR /v1/swap_7702)',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
          groupBies: [
            {
              facet: '@resource.url_path',
              limit: 10,
              sort: { aggregation: 'cardinality', metric: '@session.id', order: 'desc' },
            },
            {
              facet: '@service',
              limit: 10,
              sort: { aggregation: 'cardinality', metric: '@session.id', order: 'desc' },
            },
          ],
        },
      ],
    },
  },
]
