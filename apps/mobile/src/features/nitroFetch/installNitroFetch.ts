import { setFirstPartyFetchOverride } from '@universe/api'
import { isIOS } from '@universe/environment'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'
import { logger } from 'utilities/src/logger/logger'

let installed = false

/**
 * Routes FIRST-PARTY API traffic (https://*.uniswap.org via createFetchClient)
 * through react-native-nitro-fetch (URLSession-backed on iOS, the only
 * platform that installs it) when the NitroFetchEnabled gate is on.
 *
 * Deliberately scoped — this never replaces `globalThis.fetch`: third-party
 * requests and any other fetch callers keep the platform network stack.
 *
 * Call after Statsig init; requests issued before init use the built-in fetch.
 * The override is one-way for the app session (rollback via the gate takes
 * effect on next launch).
 *
 * Known tradeoff while the gate is on, for the allowlisted hosts only:
 * Datadog RUM resource auto-instrumentation and first-party trace propagation
 * hook the built-in stack, so overridden traffic is not RUM-tracked.
 */
export function installNitroFetchIfEnabled(): void {
  if (installed) {
    return
  }
  // iOS-only until Cronet trust-policy parity is verified: on iOS nitro-fetch
  // rides URLSession, so ATS and the platform trust store still apply. On
  // Android, Cronet does not consult network_security_config (trust anchors,
  // pin-sets, user-CA rejection), so the override must stay build-blocked
  // there — not merely flag-blocked — until Cronet is configured to enforce
  // the same policies.
  if (!isIOS) {
    return
  }
  if (!getFeatureFlag(FeatureFlags.NitroFetchEnabled)) {
    return
  }
  try {
    // Lazy require: importing react-native-nitro-fetch instantiates its native
    // HybridObjects at module scope, which throws if the native lib is unavailable.
    // oxlint-disable-next-line typescript/no-var-requires
    const { fetch: nitroFetch } = require('react-native-nitro-fetch') as { fetch: typeof globalThis.fetch }
    setFirstPartyFetchOverride(nitroFetch)
    installed = true
    logger.info(
      'installNitroFetch.ts',
      'installNitroFetchIfEnabled',
      'nitro-fetch installed as first-party fetch override',
    )
  } catch (error) {
    logger.error(error, {
      tags: { file: 'installNitroFetch.ts', function: 'installNitroFetchIfEnabled' },
    })
  }
}
