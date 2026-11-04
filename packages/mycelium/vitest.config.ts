import path from 'path'
import react from '@vitejs/plugin-react'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import { defineConfig } from 'vitest/config'

const config = defineConfig({
  plugins: [react()],
  define: {
    // Build-time constant every consuming bundler injects; styled()'s
    // definition-time validation gates on it (mirrors packages/tailwind).
    __DEV__: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./vitest-setup.ts'],
    // The button-compat pin tests render an 8960-case matrix through
    // renderToStaticMarkup, so they are throughput-bound and stretch under
    // runner contention — past vitest's 5s default on a busy CI box.
    testTimeout: 30000,
    env: {
      // The root barrel reaches @universe/environment, whose platform split
      // reads getConfig().appId at import time (packages/tailwind precedent).
      APP_ID: 'web',
    },
  },
  resolve: {
    // Prefer .web platform splits so tests exercise the web implementations.
    // Extends (rather than replaces) Vite's default extension list so
    // extensionless .mjs/.mts imports keep resolving.
    extensions: ['.web.ts', '.web.tsx', '.mts', '.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: {
      'utilities/src': path.resolve(__dirname, '../utilities/src'),
    },
  },
})

// The portal native leg renders through `@rn-primitives/portal`, whose dist
// ships untransformed JSX and is externalized by default. The shared preset is
// what every other package's vitest config uses to make it loadable (JSX
// transform + ESM-leg alias + `server.deps.inline`). 'native' leg: this wiring
// exists for a `.native.tsx` suite, and portal publishes one
// platform-agnostic build either way.
export default withRnPrimitives(config)
