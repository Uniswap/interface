import { settings } from '../../config'
import { getDefaultServicePresets } from '../../dashboard-factory'
import { DashboardDefinition } from '../../dashboard-types'

const env = settings.environment
// APM trace metrics and the privy_embedded_wallet.* custom metrics are both
// tagged by service + env.
const apmFilter = `service:privy-embedded-wallet,env:${env}`

const APM_PREFIX = 'trace.uniswap.privyembeddedwallet.v1.EmbeddedWalletService'

// Web RUM: the embedded-wallet recovery flow is driven by the `Web` RUM app and
// observed client-side as resource (fetch) calls to the entry-gateway recovery
// RPCs — there is no `*recovery*` view name on web, so measure it via resources.
// (The mobile OnDeviceRecovery / OnboardingRecoveryFlow views are the
// self-custodial wallet's own recovery UX, a different surface — excluded here.)
const feHost = `entry-gateway.backend-${env}.api.uniswap.org`
const feRecoverySearch = `@type:resource @application.name:Web @resource.url_host:${feHost} @resource.url:(*ecovery* OR *OprfEvaluate* OR *DecryptionResult*)`

/**
 * Recovery / OPRF flow for the privy-embedded-wallet service (PIN-based wallet
 * recovery). Isolates the recovery funnel as its own group — the Service
 * Overview and Security + Dependencies dashboards don't break it out.
 *
 * Sources:
 *   - APM trace metrics (`${APM_PREFIX}_<Method>.*`) for per-step call rate +
 *     latency. 100%-sampled, safe to count.
 *   - `privy_embedded_wallet.*` custom metrics for success/reject/failure splits
 *     (status / auth / reason / rate_limited) that APM can't express.
 *   - Web RUM resource events for the client-side mirror of the same flow.
 *
 * Recovery is low-volume in prod (OprfEvaluate ~single digits/30d); staging
 * carries the bulk of the test traffic. Several custom metrics
 * (`recovery_execute`, `export_seed_phrase_with_recovery`, `get_recovery_config`,
 * `check_recovery_availability`) have tag configuration disabled in prod and
 * can't be filtered by env/status, so those steps are tracked via APM
 * (`.hits`/`.errors`) instead. Only `oprf_evaluate`, `recovery_setup`, and
 * `recovery_decryption_failed` expose tag-filterable status splits.
 */
export const privyEmbeddedWalletRecoveryOprfDashboard: DashboardDefinition = {
  id: 'privy-embedded-wallet_recovery_oprf',
  title: `[Privy Embedded Wallet] [${env}] Recovery / OPRF`,
  description:
    'PIN-based recovery + OPRF flow: per-step funnel, OPRF success/reject, setup/execute/decryption outcomes, seed-phrase export, and the Web client-side mirror.',
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
    // Row 1: Recovery funnel — per-step call rate (full width)
    {
      layout: { x: 0, y: 0, width: 12, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Recovery Funnel — Call Rate by Step (APM)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'check', alias: 'CheckRecoveryAvailability' },
                { formulaExpression: 'config', alias: 'GetRecoveryConfig' },
                { formulaExpression: 'setup', alias: 'SetupRecovery' },
                { formulaExpression: 'oprf', alias: 'OprfEvaluate' },
                { formulaExpression: 'execute', alias: 'ExecuteRecovery' },
                { formulaExpression: 'report', alias: 'ReportDecryptionResult' },
                { formulaExpression: 'export', alias: 'ExportSeedPhraseWithRecovery' },
                { formulaExpression: 'del', alias: 'DeleteRecovery' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'check',
                    query: `sum:${APM_PREFIX}_CheckRecoveryAvailability.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'config',
                    query: `sum:${APM_PREFIX}_GetRecoveryConfig.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'setup',
                    query: `sum:${APM_PREFIX}_SetupRecovery.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'oprf',
                    query: `sum:${APM_PREFIX}_OprfEvaluate.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'execute',
                    query: `sum:${APM_PREFIX}_ExecuteRecovery.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'report',
                    query: `sum:${APM_PREFIX}_ReportDecryptionResult.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'export',
                    query: `sum:${APM_PREFIX}_ExportSeedPhraseWithRecovery.hits{${apmFilter}}.as_rate()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'del',
                    query: `sum:${APM_PREFIX}_DeleteRecovery.hits{${apmFilter}}.as_rate()`,
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
    // Row 2: OPRF outcomes (success vs rejected) | OPRF success by auth
    {
      layout: { x: 0, y: 4, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'OPRF Evaluate — Outcomes (success / rejected)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:privy_embedded_wallet.oprf_evaluate{${apmFilter}} by {status}.as_count()`,
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
      layout: { x: 6, y: 4, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'OPRF Evaluate — Successes by Auth',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:privy_embedded_wallet.oprf_evaluate{${apmFilter},status:success} by {auth}.as_count()`,
                  },
                },
              ],
              style: { palette: 'green', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
    // Row 3: OPRF reject rate % | Recovery step latency P95
    {
      layout: { x: 0, y: 8, width: 6, height: 4 },
      definition: {
        queryValueDefinition: {
          title: 'OPRF Reject Rate (%)',
          autoscale: true,
          customUnit: '%',
          precision: 1,
          requests: [
            {
              formulas: [{ formulaExpression: '(rejected / total) * 100' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'rejected',
                    query: `sum:privy_embedded_wallet.oprf_evaluate{${apmFilter},status:rejected}.as_count()`,
                    aggregator: 'sum',
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'total',
                    query: `sum:privy_embedded_wallet.oprf_evaluate{${apmFilter}}.as_count()`,
                    aggregator: 'sum',
                  },
                },
              ],
            },
          ],
        },
      },
    },
    {
      layout: { x: 6, y: 8, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Recovery Step Latency (P95)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'oprf', alias: 'OprfEvaluate' },
                { formulaExpression: 'setup', alias: 'SetupRecovery' },
                { formulaExpression: 'execute', alias: 'ExecuteRecovery' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'oprf',
                    query: `p95:${APM_PREFIX}_OprfEvaluate{${apmFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'setup',
                    query: `p95:${APM_PREFIX}_SetupRecovery{${apmFilter}}`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'execute',
                    query: `p95:${APM_PREFIX}_ExecuteRecovery{${apmFilter}}`,
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
    // Row 4: Setup outcomes (custom status split) | Decryption failures by rate_limited
    {
      layout: { x: 0, y: 12, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Recovery Setup — Outcomes by Status',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:privy_embedded_wallet.recovery_setup{${apmFilter}} by {status}.as_count()`,
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
      layout: { x: 6, y: 12, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          // recovery_decryption_failed is the liveliest recovery signal — the
          // PIN-retry path. rate_limited:true means the user hit the cooldown.
          title: 'Recovery Decryption Failures (by rate_limited)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'query1',
                    query: `sum:privy_embedded_wallet.recovery_decryption_failed{${apmFilter}} by {rate_limited}.as_count()`,
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
    // Row 5: Execute / Export calls + errors (APM) | Web — recovery calls by endpoint
    {
      layout: { x: 0, y: 16, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          // recovery_execute / export_seed_phrase_with_recovery custom metrics
          // have tag config disabled, so use APM hits/errors here.
          // ExportSeedPhraseWithRecovery is the P0 seed-phrase export path.
          title: 'Execute / Export — Calls & Errors (APM)',
          showLegend: true,
          requests: [
            {
              formulas: [
                { formulaExpression: 'execHits', alias: 'ExecuteRecovery' },
                { formulaExpression: 'execErr', alias: 'ExecuteRecovery errors' },
                { formulaExpression: 'expHits', alias: 'ExportSeedPhraseWithRecovery' },
                { formulaExpression: 'expErr', alias: 'ExportSeedPhraseWithRecovery errors' },
              ],
              queries: [
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'execHits',
                    query: `sum:${APM_PREFIX}_ExecuteRecovery.hits{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'execErr',
                    query: `sum:${APM_PREFIX}_ExecuteRecovery.errors{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'expHits',
                    query: `sum:${APM_PREFIX}_ExportSeedPhraseWithRecovery.hits{${apmFilter}}.as_count()`,
                  },
                },
                {
                  metricQuery: {
                    dataSource: 'metrics',
                    name: 'expErr',
                    query: `sum:${APM_PREFIX}_ExportSeedPhraseWithRecovery.errors{${apmFilter}}.as_count()`,
                  },
                },
              ],
              style: { palette: 'orange', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
    {
      layout: { x: 6, y: 16, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Web — Recovery Calls by Endpoint (RUM)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  eventQuery: {
                    dataSource: 'rum',
                    name: 'query1',
                    search: { query: feRecoverySearch },
                    computes: [{ aggregation: 'count' }],
                    groupBies: [
                      { facet: '@resource.url_path_group', limit: 10, sort: { aggregation: 'count', order: 'desc' } },
                    ],
                  },
                },
              ],
              style: { palette: 'dog_classic', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'bars',
            },
          ],
        },
      },
    },
    {
      layout: { x: 0, y: 20, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Web — Recovery Client Errors by Endpoint (RUM, 4xx/5xx)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  eventQuery: {
                    dataSource: 'rum',
                    name: 'query1',
                    search: { query: `${feRecoverySearch} @resource.status_code:[400 TO 599]` },
                    computes: [{ aggregation: 'count' }],
                    groupBies: [
                      { facet: '@resource.url_path_group', limit: 10, sort: { aggregation: 'count', order: 'desc' } },
                    ],
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
    // Row 6: Web — recovery client latency P95 by endpoint
    {
      layout: { x: 6, y: 20, width: 6, height: 4 },
      definition: {
        timeseriesDefinition: {
          title: 'Web — Recovery Client Latency P95 by Endpoint (RUM, ns)',
          showLegend: true,
          requests: [
            {
              formulas: [{ formulaExpression: 'query1' }],
              queries: [
                {
                  eventQuery: {
                    dataSource: 'rum',
                    name: 'query1',
                    search: { query: feRecoverySearch },
                    computes: [{ aggregation: 'pc95', metric: '@resource.duration' }],
                    groupBies: [
                      {
                        facet: '@resource.url_path_group',
                        limit: 10,
                        sort: { aggregation: 'pc95', metric: '@resource.duration', order: 'desc' },
                      },
                    ],
                  },
                },
              ],
              style: { palette: 'purple', lineType: 'solid', lineWidth: 'normal' },
              displayType: 'line',
            },
          ],
        },
      },
    },
  ],
}
