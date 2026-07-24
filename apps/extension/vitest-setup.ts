// Shared vitest setup: base chrome global, AsyncStorage, redux-persist, expo, WalletConnect,
// NetInfo, and other cross-package mocks.
import '../../config/vitest-presets/vitest/setup.js'
import '../../packages/utilities/vitest-package-mocks'
import '../../packages/uniswap/vitest-package-mocks'
// React Native component mocks (gesture-handler, reanimated, svg, safe-area, moti, matchMedia, ...)
import '../../packages/ui/vitest-setup'
import { AppearanceSettingType } from 'uniswap/src/features/appearance/slice'
import { vi } from 'vitest'

// Mirrors @universe/environment/jest-package-mocks: mock the env module so the throwing
// platform-split stubs in src/environment/env.ts don't blow up at module load
// (constants.ts calls isRNDev/isDevEnv eagerly). Unlike environment/vitest-package-mocks,
// this keeps the real platform booleans so isExtensionApp stays true (APP_ID=extension).
vi.mock('@universe/environment/src/environment/env', () => ({
  BUNDLE_ID: 'com.uniswap.mobile.dev',
  isTestEnv: vi.fn(() => true),
  isDevEnv: vi.fn(() => false),
  isBetaEnv: vi.fn(() => false),
  isProdEnv: vi.fn(() => false),
  isRNDev: vi.fn(() => true),
  isUnitTestEnv: vi.fn(() => true),
  isE2eTestEnv: vi.fn(() => false),
  localDevDatadogEnabled: false,
  isDatadogEnabled: vi.fn(() => false),
}))

// Mock @testing-library/react-native with @testing-library/react (mirrors packages/uniswap's
// vitest-setup). The extension's tests use @testing-library/react directly, but
// uniswap/src/test/render (imported for mockUniswapContext) imports @testing-library/react-native,
// which requires the React Native runtime and can't load in jsdom.
vi.mock('@testing-library/react-native', async () => {
  const rtl = await import('@testing-library/react')

  // oxlint-disable-next-line typescript/no-explicit-any, max-params -- matching React Native Testing Library's fireEvent signature
  const fireEventBase = (element: Element, eventName: string, data?: any): boolean => {
    const eventMap: Record<string, string> = {
      press: 'click',
      onPress: 'click',
      longPress: 'contextmenu',
      contextMenu: 'contextmenu',
      onMouseDown: 'mousedown',
      mouseDown: 'mousedown',
    }
    const webEventName = eventMap[eventName] || eventName
    // oxlint-disable-next-line typescript/no-explicit-any -- matching React Native Testing Library's fireEvent signature
    const fireEventFn = (rtl.fireEvent as any)[webEventName] || rtl.fireEvent
    return fireEventFn(element, data)
  }

  const fireEvent = Object.assign(fireEventBase, {
    ...rtl.fireEvent,
    press: (element: Element, options?: object) => rtl.fireEvent.click(element, options),
    changeText: (element: Element, text: string) => rtl.fireEvent.change(element, { target: { value: text } }),
  })

  // oxlint-disable-next-line typescript/no-explicit-any -- wrapping RTL render requires flexible types
  const render = (...args: any[]) => {
    const result = rtl.render(...args)
    return {
      ...result,
      toJSON: () => result.asFragment(),
    }
  }

  return {
    ...rtl,
    render,
    fireEvent,
    cleanup: rtl.cleanup,
    cleanupAsync: async () => rtl.cleanup(),
  }
})

// uniswap/src/i18n uses require() (for init timing in the extension production build), which
// can't resolve aliased specifiers under vitest's ESM transform. Recreate the module with the
// same semantics: run the real i18n-setup, then re-export i18next + changeLanguage.
vi.mock('uniswap/src/i18n', async () => {
  await import('uniswap/src/i18n/i18n-setup')
  const i18n = (await import('i18next')).default
  const { changeLanguage } = await import('uniswap/src/i18n/changeLanguage')
  return { default: i18n, changeLanguage }
})

// Mirrors the effective jest gating mock (uniswap/jest-package-mocks): keep actual exports,
// only stub the statsig client init.
vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return {
    ...actual,
    useClientAsyncInit: vi.fn(() => ({
      client: null,
      isLoading: true,
    })),
  }
})

// Mirrors uniswap/jest-package-mocks
vi.mock('uniswap/src/data/rest/tokenRankings', async (importOriginal) => {
  const actual = await importOriginal<typeof import('uniswap/src/data/rest/tokenRankings')>()
  return {
    ...actual,
    useTokenRankingsQuery: vi.fn(() => ({ data: undefined, isLoading: false, isFetching: false, error: null })),
  }
})

// Mirrors config/jest-presets/jest/setup.js (not ported to the shared vitest setup)
vi.mock('expo-local-authentication', () => ({
  authenticateAsync: vi.fn(() => Promise.resolve({ success: true })),
  hasHardwareAsync: vi.fn(() => Promise.resolve(true)),
  isEnrolledAsync: vi.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: vi.fn(() => Promise.resolve([1, 2])),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2, IRIS: 3 },
}))

// Manual mock previously auto-applied from src/test/__mocks__ under jest
vi.mock('@react-native-masked-view/masked-view', async () => {
  return await vi.importActual('./src/test/__mocks__/@react-native-masked-view/masked-view')
})

// The shared setup's redux-persist mock factory spreads a Promise (vi.importActual is not
// awaited there), which drops every real export the extension store needs (e.g. persistStore).
// Re-register the mock with the real module kept. doMock applies to all imports that happen
// after setup, i.e. every test-file import.
vi.doMock('redux-persist', async (importOriginal) => {
  const real = await importOriginal<typeof import('redux-persist')>()
  return {
    ...real,
    persistReducer: vi.fn().mockImplementation((_config: unknown, reducers: unknown) => reducers),
  }
})

const ignoreLogs: Record<string, string[]> = {
  error: [
    // We need to use _persist property to ensure that the state is properly
    // rehydrated (https://github.com/Uniswap/universe/pull/7502/files#r1566259088)
    'Unexpected key "_persist" found in previous state received by the reducer.',
  ],
}

// Ignore certain logs that are expected during tests.
Object.entries(ignoreLogs).forEach(([method, messages]) => {
  const key = method as 'error'
  const originalMethod = console[key].bind(console)
  console[key] = (...args: unknown[]): void => {
    if (messages.some((message) => args.some((arg) => typeof arg === 'string' && arg.startsWith(message)))) {
      return
    }
    originalMethod(...args)
  }
})

const MOCK_LANGUAGE = 'en-US'

// jest-chrome builds its mocked chrome APIs from the global `jest` object;
// vi's mock functions are API-compatible, so alias it before importing.
;(globalThis as unknown as { jest: typeof vi }).jest = vi
const { chrome } = await import('jest-chrome')

global.chrome = {
  ...chrome,
  i18n: {
    ...global.chrome.i18n,
    getUILanguage: vi.fn().mockReturnValue(MOCK_LANGUAGE),
  },
  storage: {
    ...chrome.storage,
    local: {
      ...chrome.storage.local,
      addListener: vi.fn(),
    },
    session: {
      get: vi.fn().mockImplementation((_keys: unknown, callback?: (items: object) => void) => {
        if (callback) {
          callback({})
        }
        return Promise.resolve({})
      }),
      set: vi.fn().mockImplementation((_items: unknown, callback?: () => void) => {
        if (callback) {
          callback()
        }
        return Promise.resolve()
      }),
      remove: vi.fn().mockImplementation((_keys: unknown, callback?: () => void) => {
        if (callback) {
          callback()
        }
        return Promise.resolve()
      }),
      clear: vi.fn().mockImplementation((callback?: () => void) => {
        if (callback) {
          callback()
        }
        return Promise.resolve()
      }),
    },
  },
} as unknown as typeof global.chrome

vi.mock('src/app/navigation/utils', () => ({
  useExtensionNavigation: (): { navigateTo: ReturnType<typeof vi.fn>; navigateBack: ReturnType<typeof vi.fn> } => ({
    navigateTo: vi.fn(),
    navigateBack: vi.fn(),
  }),
}))

vi.mock('wallet/src/features/focus/useIsFocused', () => ({
  default: vi.fn().mockReturnValue(true),
}))

const mockAppearanceSetting = AppearanceSettingType.System
vi.mock('uniswap/src/features/appearance/hooks', () => {
  return {
    useCurrentAppearanceSetting: (): AppearanceSettingType => mockAppearanceSetting,
    useSelectedColorScheme: (): 'light' => 'light',
  }
})

// Mock IntersectionObserver for Tamagui's useElementLayout
const IntersectionObserverMock = vi.fn().mockImplementation((callback: IntersectionObserverCallback) => ({
  observe: vi.fn((element: Element) => {
    // Immediately call the callback with a mock entry
    if (callback && element) {
      callback(
        [
          {
            target: element,
            isIntersecting: true,
            intersectionRatio: 1,
            boundingClientRect: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            },
            intersectionRect: {
              x: 0,
              y: 0,
              width: 100,
              height: 100,
              top: 0,
              right: 100,
              bottom: 100,
              left: 0,
            },
            rootBounds: null,
            time: 0,
          } as unknown as IntersectionObserverEntry,
        ],
        undefined as unknown as IntersectionObserver,
      )
    }
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn().mockReturnValue([]),
  root: null,
  rootMargin: '',
  thresholds: [],
}))

global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver
