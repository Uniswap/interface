import * as datadog from '@pulumi/datadog'
import { MonitorDefinition } from '../../types'
import { CODE_URL, OWNER_MENTIONS, TEAM } from './constants'

// Emitted by reportAppStartTiming.native.ts; its unit test pins this action name and these attributes.
const APP_START_FILTER = 'service:com.uniswap.mobile env:prod @action.name:app_start_tti'

const MOBILE_GROUP_BY: datadog.types.input.RumMetricGroupBy[] = [
  { path: '@device.model', tagName: 'device.model' },
  { path: '@os.name', tagName: 'os.name' },
  { path: 'version', tagName: 'version' },
]

export const APP_START_TTI_METRIC = 'mobile.app_start.tti_ms'
// Counted by the SDK's session tracking, independent of the custom-action path app_start_tti uses.
export const MOBILE_SESSIONS_METRIC = 'mobile.sessions'

// app_start_tti fires on cold starts only, so a healthy version reports 0.55–0.75 per session.
const MIN_EVENTS_PER_SESSION = 0.3
// Missing events beyond MIN_EVENTS_PER_SESSION before alerting: a silent version alerts past ~200 sessions in 12h.
const MISSING_EVENTS_THRESHOLD = 60

export const platformInfraRumMetrics: Record<string, datadog.RumMetricArgs> = {
  [APP_START_TTI_METRIC]: {
    name: APP_START_TTI_METRIC,
    eventType: 'action',
    compute: { aggregationType: 'distribution', includePercentiles: true, path: '@context.loading_time' },
    // Drops launches that sat in the background before first render.
    filter: { query: `${APP_START_FILTER} @context.loading_time:<60000` },
    groupBies: MOBILE_GROUP_BY,
  },
  'mobile.app_start.js_boot_ms': {
    name: 'mobile.app_start.js_boot_ms',
    eventType: 'action',
    compute: { aggregationType: 'distribution', includePercentiles: true, path: '@context.js_boot_time_ms' },
    filter: { query: `${APP_START_FILTER} @context.js_boot_time_ms:<60000` },
    groupBies: MOBILE_GROUP_BY,
  },
  [MOBILE_SESSIONS_METRIC]: {
    name: MOBILE_SESSIONS_METRIC,
    eventType: 'session',
    compute: { aggregationType: 'count' },
    filter: { query: 'service:com.uniswap.mobile env:prod @session.type:user' },
    groupBies: [{ path: 'version', tagName: 'version' }],
    // Sessions update until they end; count each one once, when it starts.
    uniqueness: { when: 'match' },
  },
}

export const platformInfraAppStartMonitors: MonitorDefinition[] = [
  {
    id: 'mobile_app_start_telemetry_missing',
    name: '[Mobile] App-start telemetry is missing on {{version.name}}',
    type: 'query alert',
    // Per version: a release that stops emitting alerts while older versions keep reporting.
    query:
      `sum(last_12h):${MIN_EVENTS_PER_SESSION} * sum:${MOBILE_SESSIONS_METRIC}{*} by {version}.as_count() - ` +
      `count:${APP_START_TTI_METRIC}{*} by {version}.as_count() > ${MISSING_EVENTS_THRESHOLD}`,
    alertBody:
      'Version {{version.name}} reported far fewer `app_start_tti` RUM actions than its sessions over the last 12h ' +
      '(healthy versions report 0.55–0.75 per session). App-start timing has likely stopped emitting on this release: ' +
      'check that `reportAppStartTiming` is still called from `onReportPrepared` in apps/mobile/src/app/App.tsx and ' +
      'that the Datadog RN SDK still delivers custom actions. ' +
      OWNER_MENTIONS,
    team: TEAM,
    priority: 4,
    thresholds: { critical: MISSING_EVENTS_THRESHOLD },
    logQuery: 'service:com.uniswap.mobile',
    runbookUrl: `${CODE_URL}/apps/mobile/src/app/App.tsx`,
    readmeUrl: `${CODE_URL}/packages/utilities/src/logger/datadog/reportAppStartTiming.native.ts`,
    dashboards: [],
    // Old versions go quiet as users upgrade; a per-version no-data alert would only report that.
    notifyNoData: false,
    // Telemetry health, not user-facing: Slack only.
    enablePaging: false,
    includeIncidentWebhook: false,
    prodOnly: true,
  },
]
