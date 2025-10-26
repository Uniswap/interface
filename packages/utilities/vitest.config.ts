import path from 'path'
import { defineConfig } from 'vitest/config'
import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'

export default defineConfig({
  ...vitestPreset,
  define: {
    ...vitestPreset.define,
    __DEV__: true,
  },
  test: {
    ...vitestPreset.test,
    setupFiles: ['./vitest-setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', 'dist'],
    testTimeout: 15000,
    deps: {
      inline: [/packages\/ui/, /packages\/uniswap/],
    },
    reporters: ['verbose'],
    coverage: {
      include: ['src/**/*.ts*'],
      exclude: ['src/**/*.d.ts', 'src/**/*.stories.**'],
    },
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      'utilities/src': path.resolve(__dirname, './src'),
      'ui/src': path.resolve(__dirname, '../ui/src'),
      'uniswap/src': path.resolve(__dirname, '../uniswap/src'),

      // React Native aliases for web testing
      'react-native': 'react-native-web',
    },
  },
})
