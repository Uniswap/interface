import { settings } from '../../config'
import { getDefaultServicePresets } from '../../dashboard-factory'
import { DashboardDefinition } from '../../dashboard-types'

// ALB metrics — these have data immediately via AWS integration (no APM required)
const albFilter = `name:dev-portal-lb,unienv:${settings.environment}`

export const devPortalDashboards: DashboardDefinition[] = [
  {
    id: 'dev-portal_service_overview',
    title: `[Dev Portal] [${settings.environment}] Service Overview`,
    description: 'Dev Portal service health: request rate, errors, latency, and status codes (ALB metrics).',
    team: 'dev-portal',
    layoutType: 'ordered',
    reflowType: 'fixed',
    templateVariables: [
      {
        name: 'env',
        prefix: 'unienv',
        defaults: [settings.environment],
      },
    ],
    presets: getDefaultServicePresets('service'),
    widgets: [
      // Row 1: Request Rate + Error Rate
      {
        layout: { x: 0, y: 0, width: 6, height: 4 },
        definition: {
          timeseriesDefinition: {
            title: 'Request Rate',
            showLegend: true,
            requests: [
              {
                formulas: [{ formulaExpression: 'query1' }],
                queries: [
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query1',
                      query: `sum:aws.applicationelb.request_count{${albFilter}}.as_rate()`,
                    },
                  },
                ],
                style: { palette: 'dog_classic', lineType: 'solid', lineWidth: 'normal' },
                displayType: 'line',
              },
            ],
          },
        },
      },
      {
        layout: { x: 6, y: 0, width: 6, height: 4 },
        definition: {
          timeseriesDefinition: {
            title: 'Error Rate (%)',
            showLegend: true,
            requests: [
              {
                formulas: [{ formulaExpression: 'query1 / query2 * 100' }],
                queries: [
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query1',
                      query: `sum:aws.applicationelb.httpcode_target_5xx{${albFilter}}.as_count()`,
                    },
                  },
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query2',
                      query: `sum:aws.applicationelb.request_count{${albFilter}}.as_count()`,
                    },
                  },
                ],
                style: { palette: 'warm', lineType: 'solid', lineWidth: 'normal' },
                displayType: 'line',
              },
            ],
          },
        },
      },
      // Row 2: Latency Percentiles + HTTP Status Distribution
      {
        layout: { x: 0, y: 4, width: 6, height: 4 },
        definition: {
          timeseriesDefinition: {
            title: 'Latency Percentiles',
            showLegend: true,
            requests: [
              {
                formulas: [
                  { formulaExpression: 'query1', alias: 'P95' },
                  { formulaExpression: 'query2', alias: 'P99' },
                ],
                queries: [
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query1',
                      query: `avg:aws.applicationelb.target_response_time.p95{${albFilter}}`,
                    },
                  },
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query2',
                      query: `avg:aws.applicationelb.target_response_time.p99{${albFilter}}`,
                    },
                  },
                ],
                style: { palette: 'dog_classic', lineType: 'solid', lineWidth: 'normal' },
                displayType: 'line',
              },
            ],
          },
        },
      },
      {
        layout: { x: 6, y: 4, width: 6, height: 4 },
        definition: {
          toplistDefinition: {
            title: 'HTTP Status Code Distribution',
            requests: [
              {
                formulas: [
                  { formulaExpression: 'query1 + query2 + query3 + query4', limit: { count: 10, order: 'desc' } },
                ],
                queries: [
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query1',
                      query: `sum:aws.applicationelb.httpcode_target_2xx{${albFilter}}.as_count()`,
                      aggregator: 'sum',
                    },
                  },
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query2',
                      query: `sum:aws.applicationelb.httpcode_target_3xx{${albFilter}}.as_count()`,
                      aggregator: 'sum',
                    },
                  },
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query3',
                      query: `sum:aws.applicationelb.httpcode_target_4xx{${albFilter}}.as_count()`,
                      aggregator: 'sum',
                    },
                  },
                  {
                    metricQuery: {
                      dataSource: 'metrics',
                      name: 'query4',
                      query: `sum:aws.applicationelb.httpcode_target_5xx{${albFilter}}.as_count()`,
                      aggregator: 'sum',
                    },
                  },
                ],
              },
            ],
          },
        },
      },
    ],
  },
]
