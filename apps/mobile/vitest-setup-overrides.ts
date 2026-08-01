import React from 'react'
import { vi } from 'vitest'

// Runs as a second setup file so its mock registrations land AFTER the shared chain imported by
// ./vitest-setup.ts (last registration wins). The shared environment mock forces web platform
// booleans; mobile tests need the native ones (what jest-expo's haste resolution provided).
vi.mock('@universe/environment', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/environment')>()
  return {
    ...actual,
    // jest-expo's default platform was ios
    isAndroid: false,
    isIOS: true,
    isWebPlatform: false,
    isMobileWeb: false,
    isWebIOS: false,
    isWebAndroid: false,
    isTouchable: true,
    isHoverable: false,
    isChrome: false,
    isSafari: false,
    isMobileWebSafari: false,
    isMobileWebAndroid: false,
    isExtensionApp: false,
    isMobileApp: true,
    isWebApp: false,
    isWebAppDesktop: false,
  }
})

// The shared uniswap package mocks register skia via the package's own mock module, which falls
// back to an EMPTY module when CanvasKit isn't available; mobile needs the plain-View stand-ins
// from its old __mocks__/@shopify/react-native-skia.ts (registered here so it wins over the chain)
vi.mock('@shopify/react-native-skia', async () => {
  const rn = (await import('react-native')) as unknown as { View: React.ComponentType }
  const PlainView = ({ children, ...props }: React.PropsWithChildren<unknown>): React.ReactElement =>
    React.createElement(rn.View, props, children)
  const noop = (): null => null
  return {
    BlurMask: PlainView,
    Canvas: PlainView,
    Circle: PlainView,
    Group: PlainView,
    LinearGradient: PlainView,
    Mask: PlainView,
    Path: PlainView,
    Rect: PlainView,
    vec: noop,
  }
})
