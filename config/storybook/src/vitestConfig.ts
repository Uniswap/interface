import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
import { createStorybookViteConfig } from 'storybook-presets/viteConfig'
import type { Alias } from 'vite'
import { defineConfig, mergeConfig, type ViteUserConfigFnObject } from 'vitest/config'

// One project per theme, so every story, and its a11y check, runs in light and dark.
const THEMES = ['light', 'dark'] as const

interface StorybookVitestOptions {
  /** Absolute path of the .storybook directory. */
  configDir: string
  /** The same aliases as the Storybook's vite config; defaults to createReactNativeWebAliases(). */
  aliases?: Alias[]
  /** Story files to leave out, relative to the vitest root (the package). */
  exclude?: string[]
}

/**
 * Runs every story as a test in Chromium, once per theme. The plugin applies main.ts but not the
 * builder's viteConfigPath, so the Storybook vite config is merged in here.
 */
export function createStorybookVitestConfig({
  configDir,
  aliases,
  exclude,
}: StorybookVitestOptions): ViteUserConfigFnObject {
  return defineConfig((env) =>
    mergeConfig(createStorybookViteConfig(env, { aliases }), {
      test: {
        testTimeout: 60_000,
        projects: THEMES.map((theme) => ({
          extends: true,
          plugins: [storybookTest({ configDir, tags: { exclude: ['no-tests'] }, initialGlobals: { theme } })],
          test: {
            name: `storybook:${theme}`,
            exclude,
            browser: {
              enabled: true,
              headless: true,
              provider: playwright(),
              instances: [{ browser: 'chromium' }],
            },
          },
        })),
      },
    }),
  )
}
