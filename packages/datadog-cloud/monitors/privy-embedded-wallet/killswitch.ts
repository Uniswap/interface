import { MonitorDefinition } from '../../types'
import { PRIVY_EMBEDDED_WALLET_RUNBOOK, SERVICE_README_URL, TEAM } from './constants'

/**
 * Kill-switch guardrail. The service emits `killswitch_blocked` (count) whenever a
 * per-endpoint runtime kill switch (config key `killswitch/<endpoint>` under the
 * dedicated `killswitch` scope) rejects a request. Any sustained volume means an
 * endpoint is currently disabled and users are being turned away — alert so a
 * switch left on (accidental or forgotten) is caught quickly. Grouped by
 * {endpoint} so the alert names the disabled RPC.
 *
 * The second monitor watches `config.read` store errors: the kill switch fails
 * OPEN on a config-read failure (a control-plane blip must not 503 signing), so a
 * sustained read-error volume means the switch state is indeterminate — an active
 * switch could be silently bypassed. The metric is not tagged by key, so this is
 * service-wide (any config read), which is the right "reads are failing" signal.
 *
 * Count metrics: an empty evaluation is treated as 0, so No Data reads as OK.
 * notifyNoData:false matches the other count monitors here.
 */
export const privyEmbeddedWalletKillSwitchMonitors: MonitorDefinition[] = [
  {
    id: 'privy_embedded_wallet_killswitch_blocked',
    name: 'Kill switch active on {{endpoint.name}}',
    type: 'query alert',
    query: `sum(last_5m):sum:killswitch_blocked{service:privy-embedded-wallet,status:failure,reason:kill_switch_active} by {endpoint}.as_count() > 0`,
    alertBody:
      'A per-endpoint kill switch is blocking requests to `{{endpoint.name}}` on privy-embedded-wallet (config key `killswitch/{{endpoint.name}}` = true). All calls to this RPC are being rejected with 503 / Code.Unavailable.\n\nIf this is an intentional incident mitigation, no action is needed. Otherwise a switch was left on or flipped by mistake: set `/config-service/privy-embedded-wallet/killswitch/{{endpoint.name}}` back to false (or delete it) to restore. Takes effect within the config cache TTL (~tens of seconds), no deploy.',
    recoveryBody: 'Kill switch on `{{endpoint.name}}` is no longer blocking requests.',
    team: TEAM,
    priority: 2,
    thresholds: { critical: 0 },
    logQuery: 'service:privy-embedded-wallet @endpoint:{{endpoint.name}}',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
  {
    id: 'privy_embedded_wallet_config_read_store_error',
    name: 'privy-embedded-wallet config reads are failing (kill switch state indeterminate)',
    type: 'query alert',
    query: `sum(last_5m):sum:config.read{service:privy-embedded-wallet,status:failure,reason:store_error}.as_count() > 10`,
    alertBody:
      'Config reads for privy-embedded-wallet are erroring against the store (SSM). The kill switch fails OPEN on a read error, so any endpoint whose switch is meant to be ON could currently be serving traffic. This is not a user-facing outage on its own, but the switch state is indeterminate until reads recover.\n\nCheck SSM Parameter Store health / throttling (40 TPS account limit) and the config-service dashboard. If a kill switch was relied on for an active incident, confirm the endpoint is actually blocked via the `killswitch_blocked` metric.',
    recoveryBody: 'privy-embedded-wallet config reads have recovered; kill switch state is authoritative again.',
    team: TEAM,
    priority: 3,
    thresholds: { critical: 10 },
    logQuery: 'service:privy-embedded-wallet "Failed to read config param"',
    runbookUrl: PRIVY_EMBEDDED_WALLET_RUNBOOK,
    readmeUrl: SERVICE_README_URL,
    dashboards: [],
    notifyNoData: false,
  },
]
