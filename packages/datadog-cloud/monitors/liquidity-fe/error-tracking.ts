import { MonitorDefinition } from '../../types'
import {
  LIQUIDITY_FE_ADDITIONAL_SLACK_CHANNELS,
  LIQUIDITY_FE_RUNBOOK,
  LIQUIDITY_VIEW_FILTER,
  TEAM,
  UNIVERSE_REPO_URL,
} from './constants'

/**
 * Frontend error monitors for liquidity pages (service:web-prod).
 *
 * Monitors JS errors on /positions, /pool, /pools, /add, /remove views
 * using Datadog RUM data filtered by @view.url_path.
 */
export const liquidityFeErrorTrackingMonitors: MonitorDefinition[] = [
  {
    id: 'liquidity_fe_web_error_count_spike',
    name: '[Web] Elevated JS errors on Liquidity pages',
    type: 'rum alert',
    query: 'formula("query1").last("1h") > 100',
    alertBody:
      'Elevated JS error count on Liquidity pages (positions, pool, add, remove). Check [Error Tracking](/error-tracking?query=service%3Aweb-prod&teams=liquidity) for new issues.',
    recoveryBody: 'JS error count on Liquidity pages has recovered below threshold.',
    team: TEAM,
    priority: 3,
    thresholds: {
      critical: 100,
      warning: 50,
    },
    logQuery: 'service:web-prod',
    runbookUrl: LIQUIDITY_FE_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    additionalSlackChannels: LIQUIDITY_FE_ADDITIONAL_SLACK_CHANNELS,
    enablePaging: false,
    includeIncidentWebhook: false,
    prodOnly: true,
    newGroupDelay: 60,
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: `@type:error env:(production OR prod) service:web-prod ${LIQUIDITY_VIEW_FILTER}`,
          },
          computes: [{ aggregation: 'count' }],
          groupBies: [
            {
              facet: '@view.url_path_group',
              limit: 10,
              sort: { aggregation: 'count', order: 'desc' },
            },
          ],
        },
      ],
    },
  },
  {
    id: 'liquidity_fe_web_error_session_impact',
    name: '[Web] Liquidity page errors impacting user sessions',
    type: 'rum alert',
    query: 'formula("cutoff_min(query1, 10) / query2").last("1h") > 0.05',
    alertBody:
      'More than 5% of sessions visiting Liquidity pages are encountering JS errors (minimum 10 affected sessions). Check [Error Tracking](/error-tracking?query=service%3Aweb-prod&teams=liquidity) for details.',
    recoveryBody: 'Session error impact on Liquidity pages has recovered below threshold.',
    team: TEAM,
    priority: 2,
    thresholds: {
      critical: 0.05,
      warning: 0.02,
      criticalRecovery: 0.02,
      warningRecovery: 0.01,
    },
    logQuery: 'service:web-prod',
    runbookUrl: LIQUIDITY_FE_RUNBOOK,
    readmeUrl: `${UNIVERSE_REPO_URL}/tree/main/apps/web`,
    dashboards: [],
    additionalSlackChannels: LIQUIDITY_FE_ADDITIONAL_SLACK_CHANNELS,
    enablePaging: true,
    includeIncidentWebhook: true,
    prodOnly: true,
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: `@type:error env:(production OR prod) service:web-prod ${LIQUIDITY_VIEW_FILTER}`,
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
        {
          name: 'query2',
          dataSource: 'rum',
          indexes: ['*'],
          search: {
            query: `@type:view env:(production OR prod) service:web-prod ${LIQUIDITY_VIEW_FILTER}`,
          },
          computes: [{ aggregation: 'cardinality', metric: '@session.id' }],
        },
      ],
    },
  },
]
