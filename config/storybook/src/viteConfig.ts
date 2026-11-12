import { createRequire } from 'node:module'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { type Alias, type ConfigEnv, defineConfig, type UserConfig } from 'vite'
import {
  createReactNativeWebAliases,
  WEB_DEDUPE,
  WEB_NODE_POLYFILL_SHIMS,
  WEB_OPTIMIZE_DEPS_EXCLUDE,
  WEB_OPTIMIZE_DEPS_INCLUDE,
  WEB_OPTIMIZE_DEPS_ROLLDOWN_OPTIONS,
  WEB_RESOLVE_EXTENSIONS,
} from 'vite-presets/moduleResolutions'
import {
  jsbiEsmInteropPlugin,
  reactNativeJsxPlugin,
  svgImportFixPlugin,
  webCommonjsPlugin,
  webNodePolyfillsPlugin,
  webSvgrPlugin,
} from 'vite-presets/plugins'

// The vitest test-env placeholders, so getConfig() resolves without a pulled .env. The file is
// CommonJS: Node can't see its named export and tsc won't take a default import of it.
const { globals: testEnvGlobals } = createRequire(import.meta.url)('vitest-presets/vitest/globals.js') as {
  globals: Record<string, unknown>
}

interface StorybookViteOptions {
  /** Replaces the default createReactNativeWebAliases(); put a Storybook's own shims before those. */
  aliases?: Alias[]
}

/**
 * The vite config for a Storybook's viteConfigPath. Storybook adds its own entries and plugins on
 * top. Not an app's vite config: those bring dev servers, proxies, CSP and bundle checks.
 */
export function createStorybookViteConfig(
  { command }: ConfigEnv,
  { aliases = createReactNativeWebAliases() }: StorybookViteOptions = {},
): UserConfig {
  return {
    define: {
      ...Object.fromEntries(
        Object.entries(testEnvGlobals).map(([key, value]) => [`process.env.${key}`, JSON.stringify(String(value))]),
      ),
      __DEV__: command === 'serve',
      'process.env.EXPO_OS': JSON.stringify('web'),
      // After the spread so the extension/web toggle wins.
      'process.env.APP_ID': JSON.stringify(process.env['STORYBOOK_EXTENSION'] === 'true' ? 'extension' : 'web'),
    },
    resolve: {
      tsconfigPaths: true,
      extensions: WEB_RESOLVE_EXTENSIONS,
      dedupe: WEB_DEDUPE,
      alias: aliases,
    },
    plugins: [
      jsbiEsmInteropPlugin(),
      reactNativeJsxPlugin(),
      // Storybook's react-vite framework doesn't add the React plugin itself.
      react(),
      tailwindcss(),
      webSvgrPlugin(),
      svgImportFixPlugin(),
      webNodePolyfillsPlugin(command),
      webCommonjsPlugin(),
    ],
    optimizeDeps: {
      include: [...WEB_OPTIMIZE_DEPS_INCLUDE, ...WEB_NODE_POLYFILL_SHIMS],
      exclude: WEB_OPTIMIZE_DEPS_EXCLUDE,
      rolldownOptions: WEB_OPTIMIZE_DEPS_ROLLDOWN_OPTIONS,
    },
  }
}

/** The default viteConfigPath target: the shared config with the default aliases. */
export default defineConfig((env) => createStorybookViteConfig(env))
