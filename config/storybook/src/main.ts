import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/react-vite'

interface MainConfigOptions {
  stories: StorybookConfig['stories']
  /** Defaults to createStorybookViteConfig() with the shared aliases. */
  viteConfigPath?: string
  /** Package names of addons on top of the shared ones. */
  addons?: string[]
  staticDirs?: StorybookConfig['staticDirs']
}

/** The main.ts every Storybook in the monorepo shares: framework, addons and vite config. */
export function createMainConfig({
  stories,
  viteConfigPath = fileURLToPath(new URL('./viteConfig.ts', import.meta.url)),
  addons = [],
  staticDirs,
}: MainConfigOptions): StorybookConfig {
  return {
    stories,
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y', 'storybook-addon-pseudo-states', ...addons].map(
      getAbsolutePath,
    ),
    framework: {
      name: getAbsolutePath('@storybook/react-vite'),
      options: { builder: { viteConfigPath } },
    },
    staticDirs,
  }
}

/** Resolves a package's directory from here, so every Storybook loads one copy of each addon. */
function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)))
}
