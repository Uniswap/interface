import { MonitorDefinition } from '../../types'
import { SWAP_POD_RUNBOOK, TEAM, UNIVERSE_REPO_URL } from './constants'

/**
 * Monitors for UniswapX order failures across extension, mobile, and web.
 *
 * Ported from UI-managed monitors:
 *   - 181401827 [Ext] Elevated failures of UniswapX orders (rum alert)
 *   - 181220777 [Mobile] Elevated failures of UniswapX orders (rum alert)
 *   - 181255093 [Web] Spike in failures of UniswapX orders: POST /v1/order >= 300 (rum alert)
 *
 * All three use cardinality(@session.id) over @type:resource RUM events scoped
 * to /v1/order. `query1` is failures, `query` is total. Formula
 * `query1 / query * 100` yields the failure rate.
 *
 * `query1` filters `status_code:>=500` so 4xx client errors (invalid orders,
 * rate limits, expired sigs) don't count as failures. `cutoff_min(query1, 5)`
 * gates the formula on at least 5 failing sessions in the window — below the
 * floor it returns NaN and the alert stays clear, so a 1-of-1 sample window
 * can't produce a 100% rate.
 */
export const swapFeUniswapXMonitors: MonitorDefinition[] = [
  {
    id: 'swap_fe_ext_uniswapx_order_failures',
    name: '[Ext] Elevated failures of UniswapX orders',
    type: 'rum alert',
    query: 'formula("cutoff_min(query1, 5) / query * 100").last("1d") > 90',
    alertBody:
      'Elevated failure rate (status >= 500) for UniswapX orders on extension. Gated on at least 5 failing sessions in the window to avoid low-volume false positives.',
    team: TEAM,
    priority: 3,
    thresholds: {
      critical: 90,
      warning: 35,
      criticalRecovery: 65,
      warningRecovery: 25,
    },
    logQuery: 'service:extension-prod',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/extension`,
    dashboards: [],
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:extension-prod @resource.url_path:/v1/order @resource.status_code:>=500',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: '@type:resource env:(production OR prod) service:extension-prod @resource.url_path:/v1/order',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
      ],
    },
  },
  {
    id: 'swap_fe_mobile_uniswapx_order_failures',
    name: '[Mobile] Elevated failures of UniswapX orders',
    type: 'rum alert',
    query: 'formula("cutoff_min(query1, 5) / query * 100").last("1d") > 90',
    alertBody:
      'Elevated failure rate (status >= 500) for UniswapX orders on mobile. Gated on at least 5 failing sessions in the window to avoid low-volume false positives.',
    team: TEAM,
    priority: 3,
    thresholds: {
      critical: 90,
      warning: 35,
      criticalRecovery: 65,
      warningRecovery: 25,
    },
    logQuery: 'service:com.uniswap.mobile',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/mobile`,
    dashboards: [],
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:com.uniswap.mobile @resource.url_path:/v1/order @resource.status_code:>=500',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: '@type:resource env:(production OR prod) service:com.uniswap.mobile @resource.url_path:/v1/order',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
      ],
    },
  },
  {
    id: 'swap_fe_web_uniswapx_order_failures_spike',
    name: '[Web] Spike in failures of UniswapX orders: POST /v1/order status code >= 500',
    type: 'rum alert',
    query: 'formula("cutoff_min(query1, 5) / query * 100").last("6h") > 90',
    alertBody:
      "Spike in UniswapX order POST /v1/order failures (status >= 500) on web. Gated on at least 5 failing sessions in the 6h window to avoid low-volume false positives — this endpoint doesn't get enough traffic to reliably evaluate rate alone.",
    team: TEAM,
    priority: 3,
    thresholds: { critical: 90, warning: 30 },
    logQuery: 'service:web-prod',
    runbookUrl: SWAP_POD_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query:
              '@type:resource env:(production OR prod) service:web-prod @resource.url_path:/v1/order @resource.status_code:>=500',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
        {
          name: 'query',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: '@type:resource env:(production OR prod) service:web-prod @resource.url_path:/v1/order',
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
      ],
    },
  },
]
