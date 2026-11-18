// Setup for the native-first run (vitest.native.config.ts), on top of vitest-setup.ts.
// The native graph reaches mycelium's and utilities' .native legs, which import RN-only
// libraries. Shapes mirror apps/mobile/vitest-setup.ts.
import '../../config/vitest-presets/vitest/react-native-mocks'
import '../utilities/vitest-package-mocks'
import { vi } from 'vitest'

// Binds to expo-modules-core's native runtime at import time.
vi.mock('expo-image', async () => {
  const rn = (await import('react-native')) as unknown as { Image: unknown }
  return { Image: rn.Image }
})

// Resolves to untranspiled src under the react-native condition (utilities' logger).
vi.mock('@datadog/mobile-react-native', () => ({
  DdLogs: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  DdRum: { addAction: vi.fn(), addError: vi.fn(), addTiming: vi.fn() },
  RumActionType: { TAP: 'TAP', SCROLL: 'SCROLL', SWIPE: 'SWIPE', BACK: 'BACK', CUSTOM: 'CUSTOM' },
}))

// Binds to a native module at import time.
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
  isWorkletFunction: () => false,
}))

// Ships untranspiled TS in lib/commonjs.
vi.mock('react-native-image-colors', () => ({
  default: { getColors: vi.fn(() => Promise.resolve({ platform: 'ios' })) },
  getColors: vi.fn(() => Promise.resolve({ platform: 'ios' })),
}))
