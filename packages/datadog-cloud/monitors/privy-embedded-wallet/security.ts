import { settings } from '../../config'
import { MonitorDefinition } from '../../types'
import { snakeCase } from '../../util'
import { APM_METRIC_PREFIX, PRIVY_EMBEDDED_WALLET_RUNBOOK, SERVICE_README_URL, TEAM, apmTagFilter } from './constants'

const env = settings.environment
const apmFilter = apmTagFilter(env)

/**
 * Security-sensitive endpoints get anomaly monitors *in addition to* their
 * baseline latency + error monitors in endpoints.ts. The anomaly monitor
 * watches request volume — a sudden spike on any of these endpoints is a
 * strong signal of credential compromise or coordinated abuse, regardless of
 * whether the requests are succeeding.
 *
 * Priority 1 monitors (seed phrase export) are P0 in the SRE plan.
 */
interface SecurityEndpoint {
  name: string
  priority: 1 | 2 | 3 | 4 | 5
  rationale: string
  /**
   * Observe-only flag. Omit (default) to page per the priority. Set false for
   * higher-volume endpoints whose anomaly band needs time to mature before we
   * trust it to page.
   */
  enablePaging?: boolean
}

const securityEndpoints: SecurityEndpoint[] = [
  {
    name: 'ExportSeedPhrase',
    priority: 1,
    rationale:
      'Seed phrase export is the highest-impact destructive action a user can take. A volume spike across users is a credential-compromise smoke alarm.',
  },
  {
    name: 'ExportSeedPhraseWithRecovery',
    priority: 1,
    rationale:
      'Recovery-key seed phrase export. Same risk profile as ExportSeedPhrase; separate monitor because the recovery flow is a distinct credential class.',
  },
  {
    name: 'DeleteAuthenticator',
    priority: 2,
    rationale:
      'An attacker who lands a session would delete the legitimate authenticator to lock the user out before draining the wallet. Spike = likely abuse.',
  },
  {
    name: 'AddAuthenticator',
    priority: 2,
    rationale:
      'Mass passkey additions across wallets indicate an attacker provisioning their own credentials. Pair with the DeleteAuthenticator monitor for a complete picture.',
  },
  {
    name: 'OprfEvaluate',
    priority: 2,
    // Observe-only: OprfEvaluate is higher-volume than the export/authenticator calls,
    // so its anomaly band needs time to settle before we trust it to page. Promote once
    // the baseline matures and APPS-9784 confirms server-side rate-limiting.
    enablePaging: false,
    rationale:
      'OprfEvaluate is the server-side OPRF call an attacker is *forced* to make to test each candidate PIN. Recovery is gated by a 4-digit PIN (10k combinations), so the OPRF rate-limit (keyed on authMethodId) is the primary brute-force defense — a volume spike is the clearest sign of PIN-guessing in progress.',
  },
]

function anomalyMonitor(spec: SecurityEndpoint): MonitorDefinition {
  const id = snakeCase(spec.name)
  return {
    id: `privy_embedded_wallet_${id}_anomaly`,
    name: `Anomalous request volume on ${spec.name}`,
    type: 'query alert',
    // Agile algorithm: sensitive to short-window spikes, recovers fast. Direction "above"
    // because *fewer* of these calls than usual is fine — we only care about spikes.
    // Bounds=3 (3σ) keeps it from firing on normal traffic ramps; tighten once we have
    // a real prod baseline.
    query: `avg(last_15m):anomalies(sum:${APM_METRIC_PREFIX}_${spec.name}.hits{${apmFilter}}.as_count(), 'agile', 3, direction='above', interval=60, alert_window='last_15m', count_default_zero='true', seasonality='hourly') >= 1`,
    alertBody: `Anomalous spike in \`${spec.name}\` requests detected.\n\n${spec.rationale}\n\nInvestigate: (1) is one user account responsible (check logs for the spike window), (2) is the geo / IP distribution unusual, (3) any correlated spike on Challenge or WalletSignIn that suggests credential stuffing.`,
    recoveryBody: `Anomalous \`${spec.name}\` request volume has returned to baseline.`,
    team: TEAM,
    priority: spec.priority,
    thresholds: { critical: 1 },
    thresholdWindows: {
      triggerWindow: 'last_15m',
      recoveryWindow: 'last_15m',
    },
    logQuery: `service:privy-embedded-wallet @resource_name:"uniswap.privyembeddedwallet.v1.EmbeddedWalletService:${spec.name}"`,
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    // These are abuse-detection signals; never silently swallow them.
    notifyNoData: false,
    // Re-notify every hour while abuse is in-flight.
    renotifyInterval: 60,
    // Only emit enablePaging when explicitly observe-only, so endpoints without the
    // flag keep their default paging behavior unchanged.
    ...(spec.enablePaging === false ? { enablePaging: false } : {}),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Un-throttled recovery decryption failures (custom DogStatsD metric, tagged
// `rate_limited`). Recovery is gated by a 4-digit PIN (10k combinations); the AES
// key derivation needs a server-side OPRF output, so the only brute-force defense
// is the backend rate-limiting recovery. A burst of `rate_limited:false` failures
// is failed PIN attempts the backend is NOT throttling — i.e. brute-force the
// rate-limiter isn't catching. As of 2026-06, `rate_limited:true` never emits in
// prod (see APPS-9784).
//
// Static threshold, not anomaly: the `rate_limited:false` baseline is ~0 (empty in
// nearly every 15m window over 30d), so an anomaly band with count_default_zero
// collapses and reads single-digit PIN fumbling as a spike. A real 4-digit
// brute-force runs to hundreds–thousands of attempts, so a floor of 15 in 15m
// filters individual fumbling without blinding detection. Observe-only until
// APPS-9784 confirms server-side rate-limiting; then turn paging on.
// ─────────────────────────────────────────────────────────────────────────────
const recoveryDecryptionFailedMonitor: MonitorDefinition = {
  id: 'privy_embedded_wallet_recovery_decryption_failed_unthrottled',
  name: 'Un-throttled recovery decryption failures on privy-embedded-wallet',
  type: 'query alert',
  query: `sum(last_15m):sum:privy_embedded_wallet.recovery_decryption_failed{${apmFilter},rate_limited:false}.as_count() > 15`,
  alertBody:
    'More than 15 *un-throttled* recovery decryption failures (`rate_limited:false`) in 15m on privy-embedded-wallet. Recovery is gated by a 4-digit PIN (10k combinations); a burst of failed attempts the backend is not rate-limiting is a PIN brute-force signal.\n\nInvestigate: (1) the Recovery / OPRF dashboard client-IP toplist for the alert window — is one client_ip (or a Tor exit) driving the failures, (2) whether the same IP is hammering OprfEvaluate, (3) whether any ExecuteRecovery + AddAuthenticator + ExportSeedPhraseWithRecovery followed (account takeover). Cross-ref APPS-9784.',
  recoveryBody: 'Un-throttled recovery decryption failures have dropped back below 15 in 15m.',
  team: TEAM,
  priority: 2,
  thresholds: { critical: 15 },
  logQuery: `service:privy-embedded-wallet @resource_name:"uniswap.privyembeddedwallet.v1.EmbeddedWalletService:ReportDecryptionResult"`,
  runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
  readmeUrl: SERVICE_README_URL,
  dashboards: [],
  notifyNoData: false,
  renotifyInterval: 60,
  // Observe-only until APPS-9784 confirms server-side rate-limiting; then flip
  // paging on.
  enablePaging: false,
}

export const privyEmbeddedWalletSecurityMonitors: MonitorDefinition[] = [
  ...securityEndpoints.map(anomalyMonitor),
  recoveryDecryptionFailedMonitor,
]
