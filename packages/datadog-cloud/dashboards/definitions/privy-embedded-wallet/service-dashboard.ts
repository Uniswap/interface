import { settings } from '../../config'
import { getDefaultServicePresets } from '../../dashboard-factory'
import { DashboardDefinition } from '../../dashboard-types'

const env = settings.environment
// ALB metrics are tagged by load balancer name; the embedded-wallet LB is `privy-wallet-lb`.
const albFilter = `name:privy-wallet-lb,unienv:${env}`
// APM metrics are tagged by service name.
const apmFilter = `service:privy-embedded-wallet,env:${env}`

export const privyEmbeddedWalletServiceDashboard: DashboardDefinition = {
  id: 'privy-embedded-wallet_service_overview',
  title: `[Privy Embedded Wallet] [${env}] Service Overview`,
  description: 'Embedded wallet service health: request rate, errors, latency (ALB + APM), per-endpoint breakdown.',
  team: 'privy-embedded-wallet',
  layoutType: 'ordered',
  reflowType: 'fixed',
  templateVariables: [
    {
      name: 'env',
      prefix: 'unienv',
      defaults: [env],
    },
  ],
  presets: getDefaultServicePresets('service'),
  widgets: [
    // Row 1: ALB request rate | ALB 5xx error rate
    {
      layout: { x: 0, y: 0, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'ALB Request Rate',
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
          title: '5xx Error Rate (%)',
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
    // Row 2: ALB latency percentiles | APM latency percentiles
    {
      layout: { x: 0, y: 4, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'ALB Latency (avg / P95 / P99)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'query1', alias: 'avg' },
                { formulaExpression: 'query2', alias: 'P95' },
                { formulaExpression: 'query3', alias: 'P99' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `avg:aws.applicationelb.target_response_time.average{${albFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `avg:aws.applicationelb.target_response_time.p95{${albFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query3',
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
        timeseriesDefinition: {
          title: 'APM Latency (P50 / P95 / P99)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'query1', alias: 'P50' },
                { formulaExpression: 'query2', alias: 'P95' },
                { formulaExpression: 'query3', alias: 'P99' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `p50:trace.web.request{${apmFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `p95:trace.web.request{${apmFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query3',
                    query: `p99:trace.web.request{${apmFilter}}`,
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
    // Row 3: HTTP status codes | Healthy hosts
    {
      layout: { x: 0, y: 8, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'HTTP Status Codes (2xx / 3xx / 4xx / 5xx)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'query1', alias: '2xx' },
                { formulaExpression: 'query2', alias: '3xx' },
                { formulaExpression: 'query3', alias: '4xx' },
                { formulaExpression: 'query4', alias: '5xx' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:aws.applicationelb.httpcode_target_2xx{${albFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `sum:aws.applicationelb.httpcode_target_3xx{${albFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query3',
                    query: `sum:aws.applicationelb.httpcode_target_4xx{${albFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query4',
                    query: `sum:aws.applicationelb.httpcode_target_5xx{${albFilter}}.as_count()`,
                  },
                },
              ],
              style: { palette: 'cool', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
    {
      layout: { x: 6, y: 8, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'ALB Healthy Hosts',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `min:aws.applicationelb.healthy_host_count{${albFilter}}`,
                  },
                },
              ],
              style: { palette: 'green', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'line',
            },
          ],
        },
      },
    },
    // Row 4: APM request rate by resource | APM P95 by resource
    {
      layout: { x: 0, y: 12, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'APM Request Rate by Endpoint',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:trace.web.request.hits{${apmFilter}} by {resource_name}.as_rate()`,
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
      layout: { x: 6, y: 12, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'APM P95 Latency by Endpoint',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `p95:trace.web.request{${apmFilter}} by {resource_name}`,
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
  ],
}
