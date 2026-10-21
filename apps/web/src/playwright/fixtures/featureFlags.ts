// oxlint-disable-next-line no-restricted-imports -- feature-flag fixture needs direct Playwright imports
import { test as base } from '@playwright/test'
import {
  FeatureFlagClient,
  FeatureFlags,
  getFeatureFlagName,
  getLocalOverridesStorageKey,
  TEST_STATSIG_SDK_KEY,
} from '@universe/gating'

/**
 * Suite-wide pinned Statsig gate values.
 *
 * Every e2e test runs with these values seeded into Statsig's local-override storage before the app
 * boots, so neither a server-side flag flip nor a failed `/config/initialize` bootstrap can change
 * the behavior under test. A failed bootstrap is the case that bites: every gate then evaluates to
 * its default (off), so specs asserting flag-gated UI see the pre-flag UI instead.
 *
 * Pin a flag here only when suite behavior depends on it, and update the pin deliberately when a
 * rollout graduates or is rolled back. Specs that need a different value pin it per-spec via
 * `test.use({ pinnedFeatureFlags: { ... } })`.
 */
export const PINNED_FEATURE_FLAGS: Partial<Record<FeatureFlags, boolean>> = {}

type FeatureFlagsFixture = {
  /**
   * Per-spec gate pins, merged over PINNED_FEATURE_FLAGS. Set via `test.use({ pinnedFeatureFlags: ... })`.
   *
   * Unlike the `featureFlagOverride` URL params that `buildUrl` emits (applied by
   * useFeatureFlagUrlOverrides in an effect gated on `!isStatsigUninitialized`), these are seeded
   * before the app boots and apply from the first gate evaluation — so they hold even when the
   * Statsig bootstrap never completes.
   */
  pinnedFeatureFlags: Partial<Record<FeatureFlags, boolean>>
  seedPinnedFeatureFlags: void
}

export const test = base.extend<FeatureFlagsFixture>({
  pinnedFeatureFlags: [{}, { option: true }],
  // Seeds the merged pins into Statsig's LocalOverrideAdapter localStorage slot before any page
  // script runs. The app's override adapter loads persisted overrides in its constructor, so the
  // pins take precedence over live Statsig values for the whole test.
  seedPinnedFeatureFlags: [
    async ({ page, pinnedFeatureFlags }, use) => {
      const gate: Record<string, boolean> = {}
      for (const [flag, value] of Object.entries({ ...PINNED_FEATURE_FLAGS, ...pinnedFeatureFlags })) {
        gate[getFeatureFlagName(Number(flag) as FeatureFlags, FeatureFlagClient.Web)] = value
      }

      // Runs on every document load, so merge into the existing slot rather than replace it:
      // overrides the app persisted at runtime (featureFlagOverride URL params, dev-menu toggles)
      // must survive the next navigation. Pins are spread last so they still win.
      await page.addInitScript(
        (seed) => {
          let store: Record<string, unknown> & { gate: Record<string, boolean> } = {
            gate: {},
            dynamicConfig: {},
            experiment: {},
            layer: {},
          }
          try {
            const existing = window.localStorage.getItem(seed.storageKey)
            if (existing) {
              store = { ...store, ...JSON.parse(existing) }
            }
          } catch {
            // corrupt slot: start from a fresh store
          }
          store.gate = { ...store.gate, ...seed.gate }
          window.localStorage.setItem(seed.storageKey, JSON.stringify(store))
        },
        {
          // e2e builds run with isTestEnv() true, so the app's override adapter is keyed by
          // TEST_STATSIG_SDK_KEY (not the real client key) — seed the matching storage slot.
          storageKey: getLocalOverridesStorageKey(TEST_STATSIG_SDK_KEY),
          gate,
        },
      )

      await use(undefined)
    },
    { auto: true },
  ],
})
