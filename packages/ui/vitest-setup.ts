// React Native-generic mocks (gesture-handler, reanimated, moti, svg, safe-area-context,
// webview, device-info, matchMedia) shared by every vitest suite that renders through
// packages/ui: the ui package's own tests plus the uniswap/wallet/mobile/extension suites,
// which all import this setup file
import '../../config/vitest-presets/vitest/react-native-mocks'
import { vi } from 'vitest'

// Mock UniconSVGs - this is required because the Unicon component uses require() in test environment
// and Node's require() can't resolve TypeScript files
vi.mock('ui/src/components/Unicon/UniconSVGs', () => ({
  Icons: {
    icon1: ['M0 0 L10 10'],
    icon2: ['M5 5 L15 15'],
  },
}))

// Mock ui/src/assets
vi.mock('ui/src/assets', async (importOriginal) => {
  const assets = (await importOriginal()) as Record<string, unknown>
  const mockedAssets: Record<string, string> = {}

  if (assets && assets !== null && assets !== undefined) {
    Object.keys(assets).forEach((key) => {
      mockedAssets[key] = `mock-asset-${key}.png`
    })
  }

  return mockedAssets
})

// Mock useDeviceInsets to use web version
vi.mock('ui/src/hooks/useDeviceInsets', () => ({
  useDeviceInsets: () => ({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  }),
}))
