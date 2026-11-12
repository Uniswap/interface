import * as datadog from '@pulumi/datadog'
import { MonitorDefinition } from '../../types'
import { CODE_URL, OWNER_MENTIONS, TEAM } from './constants'
const WEB_RUM_APP_ID = '062d6845-ac60-4c9c-af9e-b17472e4aef1'
const MIN_VIEWS_PER_VERSION = 2500

// RUM metrics add `@type` from their event type and reject a second one, so only the monitors add it.
const WEB_SESSION_FILTER = `@application.id:${WEB_RUM_APP_ID} service:web-prod @session.type:user`
const WEB_VIEW_FILTER = `@type:view ${WEB_SESSION_FILTER}`
const TRACKED_VIEWS = ['/swap', '/explore', '/positions'] as const

const WEB_GROUP_BY: datadog.types.input.RumMetricGroupBy[] = [
  { path: 'version', tagName: 'version' },
  { path: '@view.name', tagName: 'view.name' },
  { path: '@device.type', tagName: 'device.type' },
]

// RUM reports durations in nanoseconds; the metrics keep the raw unit.
const VITALS = {
  lcp: { path: '@view.largest_contentful_paint', label: 'LCP' },
  loading_time: { path: '@view.loading_time', label: 'loading time' },
  inp: { path: '@view.interaction_to_next_paint', label: 'INP' },
} as const

export const platformInfraWebRumMetrics: Record<string, datadog.RumMetricArgs> = Object.fromEntries(
  Object.entries(VITALS).map(([key, { path }]) => {
    const name = `web.view.${key}_ns`
    return [
      name,
      {
        name,
        eventType: 'view',
        compute: { aggregationType: 'distribution', includePercentiles: true, path },
        filter: {
          query: `${WEB_SESSION_FILTER} @device.type:(Desktop OR Mobile) @view.name:(${TRACKED_VIEWS.map((v) => `"${v}"`).join(' OR ')})`,
        },
        groupBies: WEB_GROUP_BY,
        // Views update until they close; count each once, with its final vitals.
        uniqueness: { when: 'end' },
      },
    ]
  }),
)

// P90 budgets: ~20% above the worst 48h per-version P90 seen; daily swings are 1.5–2×, so these catch only gross breakage.
// /explore has too few views to alert on.
const BUDGETS_MS: { view: string; device: 'Desktop' | 'Mobile'; lcp: number; inp: number }[] = [
  { view: '/swap', device: 'Desktop', lcp: 14_000, inp: 650 },
  { view: '/swap', device: 'Mobile', lcp: 22_500, inp: 1_250 },
  { view: '/positions', device: 'Desktop', lcp: 11_000, inp: 230 },
  { view: '/positions', device: 'Mobile', lcp: 17_000, inp: 750 },
]

function webVitalBudgetMonitor(row: (typeof BUDGETS_MS)[number], vital: 'lcp' | 'inp'): MonitorDefinition {
  const { view, device } = row
  const budgetMs = row[vital]
  const { path, label } = VITALS[vital]
  const search = { query: `${WEB_VIEW_FILTER} @device.type:${device} @view.name:"${view}"` }
  const groupBies = [{ facet: 'version', limit: 10, sort: { aggregation: 'count', order: 'desc' } }]
  return {
    id: `web_${view.slice(1)}_${device.toLowerCase()}_${vital}_p90_budget`,
    name: `[Web] ${view} ${device.toLowerCase()} P90 ${label} over ${budgetMs} ms on {{version.name}}`,
    type: 'rum alert',
    // Zeroes versions with fewer than MIN_VIEWS_PER_VERSION views (RUM samples 10% of sessions) so a stale tab cannot fire.
    query: `formula("query1 / 1000000 * clamp_max(floor(query2 / ${MIN_VIEWS_PER_VERSION}), 1)").last("2d") > ${budgetMs}`,
    variables: {
      eventQueries: [
        {
          name: 'query1',
          dataSource: 'rum',
          indexes: ['*'],
          search,
          computes: [{ aggregation: 'pc90', metric: path }],
          groupBies,
        },
        { name: 'query2', dataSource: 'rum', indexes: ['*'], search, computes: [{ aggregation: 'count' }], groupBies },
      ],
    },
    alertBody:
      `Release {{version.name}} has a P90 ${label} of {{value}} ms on ${view} (${device.toLowerCase()}) over the last two days, ` +
      `above the ${budgetMs} ms budget. Compare it with the previous release in RUM (group by version) and check what shipped in it. ${OWNER_MENTIONS}`,
    team: TEAM,
    priority: 4,
    thresholds: { critical: budgetMs },
    logQuery: 'service:web-prod',
    runbookUrl: `${CODE_URL}/packages/datadog-cloud/monitors/platform-infra/web-vitals.ts`,
    readmeUrl: `${CODE_URL}/packages/uniswap/src/utils/datadog.web.ts`,
    dashboards: [],
    enablePaging: false,
    includeIncidentWebhook: false,
    prodOnly: true,
  }
}

export const platformInfraWebVitalMonitors: MonitorDefinition[] = BUDGETS_MS.flatMap((row) => [
  webVitalBudgetMonitor(row, 'lcp'),
  webVitalBudgetMonitor(row, 'inp'),
])
