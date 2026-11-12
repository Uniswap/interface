import * as datadog from '@pulumi/datadog'
import { DashboardDefinition } from '../../dashboard-types'

// Metric names come from monitors/platform-infra/web-vitals.ts (RUM metrics, nanoseconds).
const VITALS = [
  { metric: 'web.view.lcp_ns', label: 'LCP' },
  { metric: 'web.view.inp_ns', label: 'INP' },
  { metric: 'web.view.loading_time_ns', label: 'Loading time' },
] as const

const NS_TO_MS = 1_000_000
const FILTER = '$device'

type TableRequest = datadog.types.input.DashboardWidgetQueryTableDefinitionRequest

function releaseComparisonRequest(metric: string): TableRequest {
  const q = ({
    name,
    pct,
    version,
  }: {
    name: string
    pct: 'p75' | 'p90'
    version: string
  }): datadog.types.input.DashboardWidgetQueryTableDefinitionRequestQuery => ({
    metricQuery: {
      name,
      dataSource: 'metrics',
      aggregator: 'percentile',
      query: `${pct}:${metric}{${FILTER},${version}} by {view.name}`,
    },
  })
  const delta = ({
    current,
    baseline,
    alias,
  }: {
    current: string
    baseline: string
    alias: string
  }): datadog.types.input.DashboardWidgetQueryTableDefinitionRequestFormula => ({
    formulaExpression: `(${current} - ${baseline}) / ${baseline} * 100`,
    alias,
    numberFormat: { unit: { canonical: { unitName: 'percent' } } },
    conditionalFormats: [
      { comparator: '>', value: 10, palette: 'white_on_red' },
      { comparator: '<', value: -10, palette: 'white_on_green' },
    ],
  })
  return {
    queries: [
      q({ name: 'p75_now', pct: 'p75', version: '$version' }),
      q({ name: 'p75_base', pct: 'p75', version: '$baseline' }),
      q({ name: 'p90_now', pct: 'p90', version: '$version' }),
      q({ name: 'p90_base', pct: 'p90', version: '$baseline' }),
    ],
    formulas: [
      { formulaExpression: `p75_now / ${NS_TO_MS}`, alias: 'P75 (ms)' },
      { formulaExpression: `p75_base / ${NS_TO_MS}`, alias: 'P75 baseline (ms)' },
      delta({ current: 'p75_now', baseline: 'p75_base', alias: 'P75 Δ %' }),
      { formulaExpression: `p90_now / ${NS_TO_MS}`, alias: 'P90 (ms)' },
      { formulaExpression: `p90_base / ${NS_TO_MS}`, alias: 'P90 baseline (ms)' },
      delta({ current: 'p90_now', baseline: 'p90_base', alias: 'P90 Δ %' }),
    ],
  }
}

export const webReleasePerfDashboard: DashboardDefinition = {
  id: 'platform-infra_web_release_perf',
  title: '[Web] Release performance: release vs baseline',
  description:
    'Field vitals (Datadog RUM, web-prod, 10% of sessions) for /swap, /positions and /explore, one release against another. ' +
    'Set `version` to the new release and `baseline` to the previous one. Linked from the perf report on each Web Release Linear project.',
  team: 'platform-infra',
  layoutType: 'ordered',
  reflowType: 'auto',
  templateVariables: [
    { name: 'version', prefix: 'version', defaults: ['*'] },
    { name: 'baseline', prefix: 'version', defaults: ['*'] },
    { name: 'device', prefix: 'device.type', defaults: ['*'], availableValues: ['Desktop', 'Mobile'] },
  ],
  widgets: [
    ...VITALS.map(({ metric, label }) => ({
      definition: {
        queryTableDefinition: {
          title: `${label}: release vs baseline by page (Δ over ±10% highlighted)`,
          requests: [releaseComparisonRequest(metric)],
        },
      },
    })),
    {
      definition: {
        toplistDefinition: {
          title: '/swap P90 LCP by release, last month (ms)',
          liveSpan: '1mo',
          requests: [
            {
              formulas: [{ formulaExpression: `lcp / ${NS_TO_MS}`, limit: { count: 10, order: 'desc' } }],
              queries: [
                {
                  metricQuery: {
                    name: 'lcp',
                    dataSource: 'metrics',
                    aggregator: 'percentile',
                    query: `p90:web.view.lcp_ns{${FILTER},view.name:/swap} by {version}`,
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      definition: {
        noteDefinition: {
          content:
            'Releases need about a day of traffic before their numbers settle (≥1,000 sampled views per page). ' +
            'Product impact: swap conversion by LCP bucket lives in Amplitude, dashboard "Page Content Load Analysis" (`71gbo8hi`). ' +
            'Budgets and alerts: `packages/datadog-cloud/monitors/platform-infra/web-vitals.ts`.',
          backgroundColor: 'gray',
          showTick: false,
        },
      },
    },
  ],
}
