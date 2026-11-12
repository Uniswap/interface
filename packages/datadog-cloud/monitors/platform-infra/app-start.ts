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
}

export const platformInfraAppStartMonitors: MonitorDefinition[] = [
  {
    id: 'mobile_app_start_telemetry_missing',
    name: '[Mobile] App-start telemetry is missing for most sessions',
    type: 'query alert',
    // Per-session ratio, not a no-data check: an SDK upgrade that breaks only new versions leaves old versions reporting.
    query: `sum(last_4h):count:${APP_START_TTI_METRIC}{*}.as_count() / sum:mobile.session.count{*}.as_count() < 0.5`,
    alertBody:
      'Fewer than half of mobile sessions report an `app_start_tti` RUM action (normal: ~0.75 per session). ' +
      'App-start timing has likely stopped emitting on a recent release: check that `reportAppStartTiming` is still ' +
      'called from `onReportPrepared` in apps/mobile/src/app/App.tsx and that the Datadog RN SDK still delivers custom actions. ' +
      OWNER_MENTIONS,
    team: TEAM,
    priority: 4,
    // Recovery band stops Warn/OK flapping while the 4h ratio hovers at the warning line.
    thresholds: { critical: 0.5, warning: 0.65, warningRecovery: 0.72 },
    logQuery: 'service:com.uniswap.mobile',
    runbookUrl: `${CODE_URL}/apps/mobile/src/app/App.tsx`,
    readmeUrl: `${CODE_URL}/packages/utilities/src/logger/datadog/reportAppStartTiming.native.ts`,
    dashboards: [],
    notifyNoData: true,
    noDataTimeframe: 1440,
    // Telemetry health, not user-facing: Slack only.
    enablePaging: false,
    includeIncidentWebhook: false,
    prodOnly: true,
  },
]
