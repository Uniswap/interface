import { expect } from 'vitest'
import { createAxeMatcher } from './src/testing/axe'

// Runtime __DEV__ global (mirrors config/vitest-presets/vitest/setup.js and
// packages/tailwind/vitest-native-setup.ts): a runtime global rather than a
// static `define` so tests can flip production behavior via
// `vi.stubGlobal('__DEV__', false)`.
const globalWithDev = globalThis as { __DEV__?: boolean }
globalWithDev.__DEV__ ??= true

expect.extend(createAxeMatcher())
