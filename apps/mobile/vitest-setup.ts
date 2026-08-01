// Shared setup: preset setup, environment/utilities/uniswap package mocks, ui RN component mocks
// (reanimated, gesture-handler, moti, svg, safe-area-context), @testing-library/react-native ->
// @testing-library/react mapping, i18n key-echo mocks, Modal mocks, wallet package mocks, webcrypto, etc.
import '../../packages/wallet/vitest-setup'
import React from 'react'
import { vi } from 'vitest'

// ─── Ports of apps/mobile/__mocks__ (jest auto-mocks for node modules) ───

// react-navigation: return a stable mocked navigation object so tests can assert navigate calls
// (port of __mocks__/@react-navigation/native.js)
vi.mock('@react-navigation/native', async (importOriginal) => {
  const RNN = await importOriginal<typeof import('@react-navigation/native')>()
  let listeners: Record<string, (...args: unknown[]) => unknown> = {}
  const setOptions = vi.fn()
  const navigate = vi.fn()

  const navigation = {
    setOptions,
    navigate,
    addListener: vi.fn((name: string, l: (...args: unknown[]) => unknown) => (listeners[name] = l)),
    getListener: (name: string) => listeners[name],
    triggerListener: (name: string, ...params: unknown[]) => listeners[name]?.(...params),
    resetListeners: () => {
      listeners = {}
    },
  }

  const useNavigation = () => navigation
  let params: Record<string, unknown> = {}
  const useRoute = () => ({ params })

  return {
    ...RNN,
    useNavigation,
    useRoute,
    setParams: (p: Record<string, unknown>) => (params = { ...params, ...p }),
  }
})

vi.mock('react-native-context-menu-view', async () => {
  const rn = (await import('react-native')) as unknown as { View: React.ComponentType }
  const PlainView = ({ children, ...props }: React.PropsWithChildren<unknown>): React.ReactElement =>
    React.createElement(rn.View, props, children)
  return { default: PlainView }
})

vi.mock('react-native-fast-image', async () => {
  const rn = (await import('react-native')) as unknown as { Image: unknown }
  const PlainImage = ({ children, ...props }: React.PropsWithChildren<unknown>): React.ReactElement =>
    React.createElement(rn.Image as React.ComponentType, props, children)
  ;(PlainImage as unknown as { resizeMode: object }).resizeMode = {}
  return { default: PlainImage }
})

vi.mock('@react-native-masked-view/masked-view', async () => {
  const rn = await import('react-native')
  const MaskedViewWeb = ({
    maskElement,
    ...props
  }: React.PropsWithChildren<{ maskElement: React.ReactNode }>): React.ReactElement =>
    React.createElement((rn as unknown as { View: React.ComponentType }).View, props, maskElement)
  return { default: MaskedViewWeb }
})

vi.mock('@react-native-firebase/app', () => ({
  default: {
    app: () => ({
      auth: () => ({
        signInAnonymously: () => undefined,
      }),
    }),
  },
}))
vi.mock('@react-native-firebase/auth', () => ({
  default: () => ({
    signInAnonymously: vi.fn(),
  }),
}))
vi.mock('@react-native-firebase/remote-config', () => ({ default: {} }))
vi.mock('@react-native-firebase/firestore', () => ({ default: {} }))

vi.mock('react-native-permissions', () => ({ default: {} }))

// ─── Expo native modules (jest-expo provided these mocks under Jest) ───

vi.mock('expo-local-authentication', () => ({
  hasHardwareAsync: vi.fn(() => Promise.resolve(true)),
  isEnrolledAsync: vi.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: vi.fn(() => Promise.resolve([])),
  authenticateAsync: vi.fn(() => Promise.resolve({ success: true })),
  cancelAuthenticate: vi.fn(),
  getEnrolledLevelAsync: vi.fn(() => Promise.resolve(0)),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
    IRIS: 3,
  },
  SecurityLevel: {
    NONE: 0,
    SECRET: 1,
    BIOMETRIC_WEAK: 2,
    BIOMETRIC_STRONG: 3,
  },
}))

vi.mock('expo-camera', async () => {
  const rn = (await import('react-native')) as unknown as { View: React.ComponentType }
  return {
    Camera: {
      getCameraPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted', granted: true })),
      requestCameraPermissionsAsync: vi.fn(() => Promise.resolve({ status: 'granted', granted: true })),
    },
    CameraView: rn.View,
    PermissionStatus: {
      DENIED: 'denied',
      GRANTED: 'granted',
      UNDETERMINED: 'undetermined',
    },
  }
})

vi.mock('expo-file-system', () => ({
  File: class MockFile {},
  UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
}))

vi.mock('expo-image', async () => {
  const rn = (await import('react-native')) as unknown as { Image: React.ComponentType }
  return {
    Image: rn.Image,
  }
})

// Datadog's RN SDK resolves to untranspiled src under the react-native condition; Vite can't
// parse it (utilities' logger imports it via Datadog.native.ts)
vi.mock('@datadog/mobile-react-native', () => ({
  DdLogs: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  DdRum: {
    addAction: vi.fn(),
    addError: vi.fn(),
    addTiming: vi.fn(),
    startView: vi.fn(),
    stopView: vi.fn(),
    addFeatureFlagEvaluation: vi.fn(),
    getCurrentSessionId: vi.fn(() => Promise.resolve('test-session-id')),
  },
  DdSdkReactNative: {
    initialize: vi.fn(() => Promise.resolve()),
    addAttributes: vi.fn(() => Promise.resolve()),
    setAttributes: vi.fn(() => Promise.resolve()),
    setUser: vi.fn(() => Promise.resolve()),
    setUserInfo: vi.fn(() => Promise.resolve()),
  },
  ErrorSource: { SOURCE: 'source', NETWORK: 'network', CONSOLE: 'console', CUSTOM: 'custom' },
  RumActionType: { TAP: 'TAP', SCROLL: 'SCROLL', SWIPE: 'SWIPE', BACK: 'BACK', CUSTOM: 'CUSTOM' },
  SdkVerbosity: { DEBUG: 'debug', INFO: 'info', WARN: 'warn', ERROR: 'error' },
}))

// react-native-worklets binds to a native module at import time; the official jest mock doesn't
// load under vitest (CJS/ESM mismatch), so hand-roll the exports our code uses
vi.mock('react-native-worklets', () => ({
  scheduleOnRN: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(...args),
  isWorkletFunction: () => false,
}))

// The statsig RN bindings require('react-native') deep inside a CJS chain vite can't alias.
// They are thin wrappers around @statsig/react-bindings (which loads fine), so map them across
// (gating's statsig.native.ts is resolved because tests use native-first platform extensions).
vi.mock('@statsig/react-native-bindings', async () => {
  const web = await vi.importActual<Record<string, unknown>>('@statsig/react-bindings')
  return {
    ...web,
    StatsigClientRN: web.StatsigClient,
    StatsigProviderRN: web.StatsigProvider,
    useClientAsyncInitRN: web.useClientAsyncInit,
  }
})

// react-native-url-polyfill imports RN internals that don't exist under react-native-web;
// jsdom/node provide a spec-compliant URL already
vi.mock('react-native-url-polyfill', () => ({
  URL: globalThis.URL,
  URLSearchParams: globalThis.URLSearchParams,
  setupURLPolyfill: vi.fn(),
}))
vi.mock('react-native-url-polyfill/auto', () => ({}))

// react-native-restart ships untranspiled src (wallet's restart.native.ts imports it)
vi.mock('react-native-restart', () => ({
  default: { Restart: vi.fn(), restart: vi.fn() },
}))

// react-native-screens resolves to untranspiled src under the react-native condition
vi.mock('react-native-screens', async () => {
  const React = (await import('react')).default
  return {
    FullWindowOverlay: ({ children }: { children?: unknown }) => React.createElement(React.Fragment, null, children),
    enableFreeze: vi.fn(),
    enableScreens: vi.fn(),
  }
})

// CJS dep of react-native-markdown-display whose require('react-native') escapes the
// react-native-web alias (node CJS fallback loads real Flow-typed RN)
vi.mock('react-native-fit-image', async () => {
  const rn = (await import('react-native')) as unknown as { Image: React.ComponentType }
  return { default: rn.Image }
})

// Ships untranspiled TS in lib/commonjs (ui's rn-image-colors.native.ts imports it)
vi.mock('react-native-image-colors', () => ({
  default: {
    getColors: vi.fn(() => Promise.resolve({ platform: 'ios', background: '#FFFFFF', primary: '#FC72FF' })),
  },
  getColors: vi.fn(() => Promise.resolve({ platform: 'ios', background: '#FFFFFF', primary: '#FC72FF' })),
}))

// Ships untranspiled TSX in lib/commonjs; babel-jest handled it, Vite/node can't parse it
vi.mock('@sparkfabrik/react-native-idfa-aaid', () => ({
  default: {
    getAdvertisingInfo: vi.fn(() => Promise.resolve({ id: null, isAdTrackingLimited: true })),
  },
  ReactNativeIdfaAaid: {
    getAdvertisingInfo: vi.fn(() => Promise.resolve({ id: null, isAdTrackingLimited: true })),
  },
}))

// ─── Ports of apps/mobile/jest-setup.js ───

vi.mock('@walletconnect/react-native-compat', () => ({}))

// Mock react-native-mmkv to avoid loading native nitro-modules in tests.
// Mirrors the createMockMMKV behavior from the library.
vi.mock('react-native-mmkv', () => {
  const createMMKV = (config: { id: string } = { id: 'mmkv.default' }): object => {
    const storage = new Map<string, unknown>()
    return {
      id: config.id,
      get size() {
        return storage.size
      },
      isReadOnly: false,
      clearAll: () => storage.clear(),
      remove: (key: string) => storage.delete(key),
      set: (key: string, value: unknown) => {
        storage.set(key, value)
      },
      getString: (key: string) => storage.get(key),
      getNumber: (key: string) => storage.get(key),
      getBoolean: (key: string) => storage.get(key),
      getBuffer: (key: string) => storage.get(key),
      contains: (key: string) => storage.has(key),
      getAllKeys: () => Array.from(storage.keys()),
      addOnValueChangedListener: () => ({ remove: () => undefined }),
      trim: () => undefined,
    }
  }
  return {
    createMMKV,
    existsMMKV: () => false,
    deleteMMKV: () => undefined,
  }
})

// Mock OneSignal package
vi.mock('react-native-onesignal', () => ({
  OneSignal: {
    Debug: {
      setLogLevel: vi.fn(),
    },
    initialize: vi.fn(),
    Notifications: {
      addEventListener: vi.fn(),
      requestPermission: vi.fn(),
    },
    User: {
      addTag: vi.fn(),
      addTags: vi.fn(),
      getOnesignalId: vi.fn(() => 'dummyUserId'),
      pushSubscription: {
        getTokenAsync: vi.fn(() => 'dummyPushToken'),
      },
    },
  },
}))

// Stub Linking and Share, matching the old jest-setup's partial react-native mock
// (react-native resolves to react-native-web here)
vi.mock('react-native', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  Linking: {
    openURL: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    canOpenURL: vi.fn(),
    getInitialURL: vi.fn(),
  },
  Share: {
    share: vi.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  },
}))

vi.mock('@react-navigation/elements', () => ({
  useHeaderHeight: vi.fn().mockImplementation(() => 200),
}))

vi.mock('react-native-bootsplash', () => ({
  hide: vi.fn().mockResolvedValue(undefined),
  isVisible: vi.fn().mockResolvedValue(false),
  useHideAnimation: vi.fn().mockReturnValue({
    container: {},
    logo: { source: 0 },
    brand: { source: 0 },
  }),
}))

vi.mock('react-native-keyboard-controller', async () => {
  // the package's jest mock references the `jest` global; vi is API-compatible for vi.fn
  ;(globalThis as unknown as { jest: typeof vi }).jest = vi
  const mock = await import('react-native-keyboard-controller/jest')
  return { ...(mock as { default?: object }).default, ...mock }
})

// Mock @gorhom/bottom-sheet with plain View components
vi.mock('@gorhom/bottom-sheet', async () => {
  const rn = (await import('react-native')) as unknown as { View: React.ComponentType }
  const { View } = rn
  return {
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
  }
})

// Port of react-native-reanimated's jest matcher used by a few mobile tests: under the vitest
// reanimated mock, animated styles land in the element's inline style
expect.extend({
  toHaveAnimatedStyle(received: unknown, expected: Record<string, unknown>) {
    const element = received as HTMLElement
    const style = element?.style
    const mismatches: string[] = []
    for (const [key, value] of Object.entries(expected)) {
      const actual = style?.[key as keyof CSSStyleDeclaration]
      if (String(actual) !== String(value)) {
        mismatches.push(`${key}: expected ${String(value)}, got ${String(actual)}`)
      }
    }
    return {
      pass: mismatches.length === 0,
      message: (): string =>
        `expected element to have animated style ${JSON.stringify(expected)}; ${mismatches.join('; ')}`,
    }
  },
})
