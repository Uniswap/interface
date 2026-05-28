import vitestPreset from 'vitest-presets/vitest/vitest-preset.js'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  ...vitestPreset,
  test: {
    ...vitestPreset.test,
    watch: false,
    coverage: {
      exclude: ['**/node_modules/**', '**/dist/**', '**/*.config.*'],
    },
  },
  resolve: {
    ...vitestPreset.resolve,
    extensions: ['.web.ts', '.web.tsx', '.ts', '.tsx', '.js', '.jsx', '.json'],
  },
})
