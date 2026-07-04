/**
 * HookSwap Terminal — v4 / hooks feature gate.
 *
 * HookSwap ships v2 + v3 only (`supportsV4: false`, LOCKED decision in CLAUDE.md);
 * there are NO hooks. The Swap Terminal has had all hook UI removed. This gate is
 * retained ONLY for surfaces still being ported (e.g. the Markets table's hook
 * column) so they render a gated "v4 — coming soon" state instead of fabricating
 * hook data. It is hard-`false` until (if) v4 ever ships; when it does, wire this
 * to a real `FeatureFlags` entry.
 */

/** Master switch for any residual hook-gated surface. `false` — HookSwap has no hooks. */
export const HOOKS_V4_ENABLED = false

/** Hook returning whether hook-gated surfaces should render live (vs. gated). */
export function useHooksV4Enabled(): boolean {
  return HOOKS_V4_ENABLED
}
