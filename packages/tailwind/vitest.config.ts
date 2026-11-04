import path from 'path'
import react from '@vitejs/plugin-react'
import { withRnPrimitives } from 'vitest-presets/vitest/rn-primitives.js'
import { defineConfig } from 'vitest/config'

// The React plugin gives the shadcn recipe behavior tests (src/recipes) a JSX
// transform under jsdom. Plain token tests keep the default `node` environment;
// the jsdom-backed tests opt in via a `@vitest-environment jsdom` docblock.
const config = defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
    pool: 'forks',
    testTimeout: 30000,
    setupFiles: ['./vitest-setup.ts'],
    env: {
      APP_ID: 'web',
    },
    server: {
      deps: {
        fallbackCJS: true,
      },
    },
  },
  define: {
    __DEV__: true,
  },
  resolve: {
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'utilities/src': path.resolve(__dirname, '../utilities/src'),
      'uniswap/src': path.resolve(__dirname, '../uniswap/src'),
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    include: ['react-native-web', '@testing-library/react'],
  },
})

export default withRnPrimitives(config)
