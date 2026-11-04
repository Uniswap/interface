import path from 'path'
import react from '@vitejs/plugin-react'
import { transformWithEsbuild } from 'vite'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

// Some RN ecosystem packages ship untranspiled JSX in .js files (babel-jest handled these)
const RN_JSX_PACKAGES = ['react-native-markdown-display']

const config = defineConfig({
  ...vitestPreset,
  plugins: [
    react(),
    {
      name: 'rn-untranspiled-jsx',
      enforce: 'pre',
      async transform(code, id) {
        if (id.endsWith('.js') && RN_JSX_PACKAGES.some((pkg) => id.includes(`node_modules/${pkg}/`))) {
          return transformWithEsbuild(code, id, { loader: 'jsx' })
        }
        return null
      },
    },
  ],
  test: {
    ...vitestPreset.test,
    pool: 'forks',
    globals: true,
    environment: 'jsdom',
    // Override the preset's jsdom customExportConditions to avoid loading React Native modules
    environmentOptions: {
      jsdom: {
        // Don't use react-native export conditions - use default web exports
        customExportConditions: [],
      },
    },
    setupFiles: ['./vitest-setup.ts', './vitest-setup-overrides.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist', 'src/**/*.stories.**'],
    testTimeout: 15000,
    // Vitest's console interceptor calls Date.now() on every console write, which breaks
    // tests that stub Date.now with an incrementing counter (see the wallet migration)
    disableConsoleIntercept: true,
    server: {
      deps: {
        // react-navigation ships untranspiled .js (Flow "typeof" imports); inline it so vite
        // transforms it and so the vitest-setup vi.mock('@react-navigation/native') applies.
        // Wallet doesn't need this because it doesn't use react-navigation.
        // uniwind imports bare `react-native` (raw Flow "typeof" source) at module scope; when
        // externalized, Node parses react-native directly and dies on `import typeof`. Inlining
        // routes it through vite, which transforms it and applies the react-native ->
        // react-native-web alias. Reached via ui/src theme hooks' native legs and
        // @universe/mycelium's compat .native legs (both resolved by this config's .native-first
        // extensions). Paired with the uniwind alias in resolve.alias — neither works without
        // the other.
        inline: [/@react-navigation\/core/, /@react-navigation\/native/, /node_modules\/uniwind\//],
      },
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.**',
        'src/test/**', // test helpers
        '**/node_modules/**',
      ],
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    ...vitestPreset.resolve,
    // Mirror jest-expo's haste platform resolution (ios/native before plain); mobile's jest config
    // deliberately did NOT prioritize .web
    extensions: [
      '.ios.ts',
      '.ios.tsx',
      '.native.ts',
      '.native.tsx',
      '.ts',
      '.tsx',
      '.web.ts',
      '.web.tsx',
      '.js',
      '.jsx',
      '.json',
    ],
    alias: [
      // Mobile absolute imports
      { find: 'src', replacement: path.resolve(__dirname, './src') },
      // uniwind's `import`/`default` exports are its WEB core, which walks real
      // CSSOM (CSSRuleList) at initialization — unavailable in this jsdom. Resolve
      // the package to its native TS source instead (the `react-native` condition
      // target, same as packages/tailwind's native parity harness). Paired with the
      // uniwind inline entry in test.server.deps.inline, which routes uniwind through
      // vite so the react-native -> react-native-web alias below applies inside it —
      // neither works without the other. Reached via @universe/mycelium's compat
      // .native legs. Exact match (bare specifier only) so uniwind/<subpath> imports
      // keep resolving through the package instead of being rewritten unresolvably.
      { find: /^uniwind$/, replacement: path.resolve(__dirname, '../../node_modules/uniwind/src/index.ts') },
      // React Native aliases for testing
      { find: 'react-native', replacement: 'react-native-web' },
      {
        find: 'react-native-gesture-handler',
        replacement: path.resolve(__dirname, '../../node_modules/react-native-gesture-handler'),
      },
    ],
  },
  optimizeDeps: {
    ...vitestPreset.optimizeDeps,
    include: ['react-native-web', '@testing-library/react-native'],
  },
})

export default withRnPrimitives(config)
