import { describe, expect, it } from 'vitest'
import { PRIVY_RECOVERY_BLOB_FAILURE, PRIVY_RECOVERY_BLOB_RESOURCE, webRumScope } from './constants'
import {
  privyEmbeddedWalletAvailabilityMonitors,
  privyEmbeddedWalletBusinessMonitors,
  privyEmbeddedWalletDepsMonitors,
  privyEmbeddedWalletEndpointMonitors,
  privyEmbeddedWalletErrorMonitors,
  privyEmbeddedWalletKillSwitchMonitors,
  privyEmbeddedWalletLatencyMonitors,
  privyEmbeddedWalletSecurityMonitors,
} from './index'

const allMonitors = [
  ...privyEmbeddedWalletAvailabilityMonitors,
  ...privyEmbeddedWalletBusinessMonitors,
  ...privyEmbeddedWalletDepsMonitors,
  ...privyEmbeddedWalletEndpointMonitors,
  ...privyEmbeddedWalletErrorMonitors,
  ...privyEmbeddedWalletKillSwitchMonitors,
  ...privyEmbeddedWalletLatencyMonitors,
  ...privyEmbeddedWalletSecurityMonitors,
]

const monitor = privyEmbeddedWalletDepsMonitors.find(
  (m) => m.id === 'privy_embedded_wallet_dep_privy_api_web_recovery_blob_failures',
)

type EventQueries = {
  eventQueries?: Array<{ search?: { query?: string }; computes?: Array<{ aggregation?: string }> }>
}
const eventQuery = (monitor?.variables as EventQueries | undefined)?.eventQueries?.[0]

describe('web recovery blob monitor', () => {
  it('reads web RUM resource events, the only place browser-to-Privy calls appear', () => {
    expect(monitor?.type).toBe('rum alert')
    expect(eventQuery?.computes).toEqual([{ aggregation: 'count' }])
    // Literal on purpose: this exact search was validated against 90 days of prod RUM.
    expect(eventQuery?.search?.query).toBe(
      'service:web-prod env:(production OR prod) @type:resource @resource.url_host:*privy* @resource.url_path:*encrypted_authorization_keys* (@resource.status_code:0 OR @resource.status_code:[400 TO 599])',
    )
  })

  it('scopes beta to its own RUM service instead of going quiet on staging', () => {
    expect(webRumScope('staging')).toBe('service:web-beta')
    expect(`${webRumScope('staging')} ${PRIVY_RECOVERY_BLOB_RESOURCE} ${PRIVY_RECOVERY_BLOB_FAILURE}`).not.toContain(
      'web-prod',
    )
  })

  it('fires on a single sampled failure over the longest event window and never pages', () => {
    expect(monitor?.query).toBe('formula("query1").last("2d") > 0')
    expect(monitor?.thresholds).toEqual({ critical: 0 })
    expect(monitor?.enablePaging).toBe(false)
    expect(monitor?.includeIncidentWebhook).not.toBe(false)
    expect(monitor?.onMissingData).toBe('default')
  })

  // The Datadog provider refuses a monitor that sets both; the staging deploy is the first place
  // that surfaces it.
  it.each(allMonitors)('$id does not set notifyNoData alongside onMissingData', (m) => {
    expect(m.notifyNoData !== undefined && m.onMissingData !== undefined).toBe(false)
  })
})
