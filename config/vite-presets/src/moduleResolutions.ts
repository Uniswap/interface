import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Alias, DepOptimizationOptions } from 'vite'

/**
 * Module resolution and dep pre-bundling for loading the monorepo's cross-platform packages on
 * the web. Shared by the web app and every Storybook, so modules resolve the same way in each.
 * The matching plugins are in plugins.ts.
 */

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')

// .web-app file extensions take priority over .web for web app-specific overrides
export const WEB_RESOLVE_EXTENSIONS = [
  '.web-app.tsx',
  '.web-app.ts',
  '.web-app.js',
  '.web.tsx',
  '.web.ts',
  // .mjs before .js (matching Vite's defaults): packages like @rn-primitives publish
  // paired .web.mjs/.web.js legs, and resolving the CJS leg breaks named ESM imports in dev
  '.web.mjs',
  '.web.js',
  '.tsx',
  '.ts',
  '.mjs',
  '.js',
]

export const WEB_DEDUPE = [
  '@uniswap/sdk-core',
  '@uniswap/v2-sdk',
  '@uniswap/v3-sdk',
  '@uniswap/v4-sdk',
  '@uniswap/router-sdk',
  '@uniswap/universal-router-sdk',
  '@uniswap/uniswapx-sdk',
  '@uniswap/permit2-sdk',
  '@visx/responsive',
  'jsbi',
  'ethers',
  'react',
  'react-dom',
]

export const WEB_OPTIMIZE_DEPS_INCLUDE = [
  'expo-linear-gradient',
  'invariant',
  'react-native-web',
  'react-native-gesture-handler',
]

export const WEB_OPTIMIZE_DEPS_EXCLUDE = ['expo-clipboard', 'expo-modules-core']

/**
 * Shims webNodePolyfillsPlugin banners onto every optimized dep, where the dep scanner can't
 * see them. List them in optimizeDeps.include, or each is found on first load at the cost of an
 * extra optimize pass and a page reload.
 */
export const WEB_NODE_POLYFILL_SHIMS = [
  'vite-plugin-node-polyfills/shims/buffer',
  'vite-plugin-node-polyfills/shims/global',
  'vite-plugin-node-polyfills/shims/process',
]

/** Rolldown options for the dep optimizer: the same extension order, and JSX allowed in .js. */
export const WEB_OPTIMIZE_DEPS_ROLLDOWN_OPTIONS: DepOptimizationOptions['rolldownOptions'] = {
  resolve: {
    extensions: [
      '.web-app.js',
      '.web-app.ts',
      '.web-app.tsx',
      '.web.mjs',
      '.web.js',
      '.web.ts',
      '.web.tsx',
      '.mjs',
      '.js',
      '.ts',
      '.tsx',
    ],
  },
  moduleTypes: {
    '.js': 'jsx',
    '.mjs': 'jsx',
    '.ts': 'ts',
    '.tsx': 'tsx',
  },
}

/** Aliases every web consumer of the shared packages needs; app-specific shims go before these. */
export function createReactNativeWebAliases(): Alias[] {
  const aliases: Record<string, string> = {
    'react-native': 'react-native-web',
    'uniswap/src': path.resolve(REPO_ROOT, 'packages/uniswap/src'),
    'utilities/src': path.resolve(REPO_ROOT, 'packages/utilities/src'),
    'ui/src': path.resolve(REPO_ROOT, 'packages/ui/src'),
    // Force JSBI to use ESM build so transform plugin can add __esModule marker
    jsbi: path.resolve(REPO_ROOT, 'node_modules/jsbi/dist/jsbi.mjs'),
  }
  return Object.entries(aliases).map(([find, replacement]) => ({ find, replacement }))
}
