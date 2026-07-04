/**
 * HookSwap Terminal — v4 / hooks feature gate.
 *
 * The Terminal concept is hook-native (Uniswap v4). Per the project's LOCKED
 * decision (CLAUDE.md), v4 is EXCLUDED for launch — we ship v2 + v3 only and
 * `supportsV4: false`. Every hook-native surface (B2 hook-fee strip + active-hook
 * selector, B1 hook marketplace grid, B4 step 03, B7 hook detail, MEV private-flow
 * routing) must therefore render a gated "v4 — coming soon" state rather than
 * fabricate hook data.
 *
 * There is intentionally NO fake hook data anywhere. When v4 is deployed, flip
 * `HOOKS_V4_ENABLED` (or wire this to a real `FeatureFlags` entry) and the gated
 * surfaces light up on live on-chain hook reads.
 */

/**
 * Master switch for every hook-native Terminal surface. `false` until v4 ships.
 *
 * TODO(v4): when the v2/v3/UR + v4 stack is deployed, replace this constant with a
 * real gating flag, e.g. `useFeatureFlag(FeatureFlags.V4Hooks)`, and source hook
 * params / fees from on-chain reads.
 */
export const HOOKS_V4_ENABLED = false

/** Hook returning whether hook-native surfaces should render live (vs. gated). */
export function useHooksV4Enabled(): boolean {
  return HOOKS_V4_ENABLED
}
