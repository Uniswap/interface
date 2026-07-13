import { settings } from '../../config'
import { getDefaultServicePresets } from '../../dashboard-factory'
import { DashboardDefinition } from '../../dashboard-types'

const env = settings.environment
const apmFilter = `service:privy-embedded-wallet,env:${env}`

const APM_PREFIX = 'trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService'

/**
 * Per-endpoint error breakdowns, security-sensitive call rates, and dependency
 * (Privy API / DynamoDB / Redis / KMS) health. Paired with the per-endpoint,
 * security-anomaly, and dependency monitors defined in monitors/privy-embedded-wallet/.
 *
 * Split out from the service overview dashboard for two reasons:
 *   1. Audience: oncall + security review these together; the service overview is
 *      what an SWE looks at to confirm "the service is up".
 *   2. File-size lint cap (500 lines per file).
 */
export const privyEmbeddedWalletSecurityDependenciesDashboard: DashboardDefinition = {
  id: 'privy-embedded-wallet_security_dependencies',
  title: `[Privy Embedded Wallet] [${env}] Security + Dependencies`,
  description:
    'Per-endpoint error breakdown, seed-phrase and authenticator-change signals, and dependency health (Privy, DynamoDB, Redis, KMS).',
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
    // Row 1: APM error rate by endpoint | Top endpoints by error count
    {
      layout: { x: 0, y: 0, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'APM Error Rate by Endpoint (%)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: '(query1 / query2) * 100' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:trace.web.request.errors{${apmFilter}} by {resource_name}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `sum:trace.web.request.hits{${apmFilter}} by {resource_name}.as_count()`,
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
    {
      layout: { x: 6, y: 0, width: 6, height: 4 },
      definition: {
        toplistDefinition: {
          title: 'Top Endpoints by Error Count',
          requests: [
            {
              formulas: [{ formulaExpression: 'query1', limit: { count: 10, order: 'desc' } }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:trace.web.request.errors{${apmFilter}} by {resource_name}.as_count()`,
                    aggregator: 'sum',
                  },
                },
              ],
            },
          ],
        },
      },
    },
    // Row 2: Seed phrase export rate (P0) | Authenticator changes (add + delete)
    {
      layout: { x: 0, y: 4, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          // Paired with the ExportSeedPhrase[WithRecovery] anomaly monitors in
          // security.ts (both P1). A sustained spike here is the smoke alarm
          // for credential compromise.
          title: 'Seed Phrase Export Rate (P0)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'query1', alias: 'ExportSeedPhrase' },
                { formulaExpression: 'query2', alias: 'ExportSeedPhraseWithRecovery' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:${APM_PREFIX}_ExportSeedPhrase.hits{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `sum:${APM_PREFIX}_ExportSeedPhraseWithRecovery.hits{${apmFilter}}.as_count()`,
                  },
                },
              ],
              style: { palette: 'warm', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
    {
      layout: { x: 6, y: 4, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          // Abuse pattern: attacker deletes the legitimate authenticator and
          // adds their own. Watch them together.
          title: 'Authenticator Changes (Add + Delete)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'query1', alias: 'AddAuthenticator' },
                { formulaExpression: 'query2', alias: 'DeleteAuthenticator' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:${APM_PREFIX}_AddAuthenticator.hits{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query2',
                    query: `sum:${APM_PREFIX}_DeleteAuthenticator.hits{${apmFilter}}.as_count()`,
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
    // Row 3: Privy API health
    {
      layout: { x: 0, y: 8, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Privy API: Request Rate + 5xx %',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'q_rate', alias: 'req/s' },
                { formulaExpression: '(q_5xx / q_total) * 100', alias: '5xx %' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q_rate',
                    query: `sum:trace.http.request.hits{${apmFilter},peer.hostname:api.privy.io}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q_5xx',
                    query: `sum:trace.http.request.hits.by_http_status{${apmFilter},peer.hostname:api.privy.io,http.status_code:5*}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q_total',
                    query: `sum:trace.http.request.hits{${apmFilter},peer.hostname:api.privy.io}.as_count()`,
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
    {
      layout: { x: 6, y: 8, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Privy API Latency (P50 / P95 / P99)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'q50', alias: 'P50' },
                { formulaExpression: 'q95', alias: 'P95' },
                { formulaExpression: 'q99', alias: 'P99' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q50',
                    query: `p50:trace.http.request{${apmFilter},peer.hostname:api.privy.io}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q95',
                    query: `p95:trace.http.request{${apmFilter},peer.hostname:api.privy.io}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'q99',
                    query: `p99:trace.http.request{${apmFilter},peer.hostname:api.privy.io}`,
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
    // Row 4: AWS / Redis dependency error counts, full width.
    {
      layout: { x: 0, y: 12, width: 12, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'AWS + Redis Dependency Errors',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'dynamo', alias: 'DynamoDB' },
                { formulaExpression: 'redis', alias: 'Redis' },
                { formulaExpression: 'kms', alias: 'KMS' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'dynamo',
                    query: `sum:trace.aws.command.errors{${apmFilter},aws_service:dynamodb}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'redis',
                    query: `sum:trace.redis.command.errors{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'kms',
                    query: `sum:trace.aws.command.errors{${apmFilter},aws_service:kms}.as_count()`,
                  },
                },
              ],
              style: { palette: 'warm', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
  ],
}
