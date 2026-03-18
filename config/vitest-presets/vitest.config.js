import { defineConfig } from 'vitest/config'
import vitestPreset from './vitest/vitest-preset.js'

// Example configuration file showing how to use the vitest preset
export default defineConfig({
  ...vitestPreset,
  // Additional overrides can be added here if needed
})