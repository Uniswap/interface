import { FeatureFlags, getFeatureFlagName, getOverrideAdapter } from '@universe/gating'

/**
 * HookSwap runs its OWN data backend (data-api at data.hookswap.org) rather than
 * Uniswap's hosted GraphQL backend, which does not index HookSwap's chains. The
 * interface only routes Markets/token-list reads to that backend when the
 * corresponding "V2 endpoints" Statsig gates are ON:
 *   - V2EndpointsPools  gates useTopPools    → DataApiService.listTopPools
 *   - V2EndpointsTokens gates useListTokens  → DataApiService.listTokens
 *
 * Our Statsig project is unreachable in production (the proxy 405s), so these
 * gates default OFF and the interface falls back to the legacy GraphQL path,
 * which shows honest "arrives with the HookSwap indexer" empty states. We force
 * exactly these two gates ON via the local override adapter so the wired data-api
 * endpoints are actually used. We deliberately do NOT force the other V2Endpoints*
 * gates (Portfolio/Positions/Search/Transactions) — the data-api only implements
 * listTokens + listTopPools; the rest are stubs, so leaving them on the legacy
 * path is no worse and avoids routing those surfaces at an unimplemented backend.
 *
 * Must be called AFTER the Statsig client has initialized (the override adapter
 * refreshes the client on each override so the new value applies without reload).
 */
const HOOKSWAP_FORCED_ON: FeatureFlags[] = [FeatureFlags.V2EndpointsPools, FeatureFlags.V2EndpointsTokens]

export function applyHookSwapForcedFlags(): void {
  const adapter = getOverrideAdapter()
  for (const flag of HOOKSWAP_FORCED_ON) {
    adapter.overrideGate(getFeatureFlagName(flag), true)
  }
}
