/**
 * Common mocks for this package. This file is intended to be imported in the jest-setup.js file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn().mockImplementation(() => ({})),
  useSafeAreaFrame: jest.fn().mockImplementation(() => ({})),
  SafeAreaProvider: jest.fn(({ children }) => children),
}))

jest.mock('ui/src/assets', () => {
  const assets = {
    ...jest.requireActual('ui/src/assets'),
  }

  Object.keys(assets).map((key) => {
    assets[key] = `mock-asset-${key}.png`
  })

  return assets
})

jest.mock('react-native-webview', () => {
  const { View } = require('react-native')
  return {
    WebView: View,
  }
})

jest.mock('ui/src/hooks/useDeviceInsets', () => jest.requireActual('ui/src/hooks/useDeviceInsets.web.ts'))

// RotatableChevron drives a Tamagui reanimated animation; in native jest its withSpring values
// serialize as non-deterministic spring nodes (omega1: NaN) depending on worker state. Render it
// without animation so snapshots are stable. RotatableChevron.tsx is a generated/cached output
// (nx build:icons), so the fix can't live in the component itself.
jest.mock('ui/src/components/icons/RotatableChevron', () => {
  const actual = jest.requireActual('ui/src/components/icons/RotatableChevron')
  const React = require('react')
  return {
    ...actual,
    RotatableChevron: (props: Record<string, unknown>) =>
      React.createElement(actual.RotatableChevron, { ...props, animation: null }),
  }
})
