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
  }
}

export const privyEmbeddedWalletSecurityMonitors: MonitorDefinition[] = securityEndpoints.map(anomalyMonitor)
