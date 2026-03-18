import { vi } from 'vitest'

// Text encoding globals
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock expo-localization
vi.mock('expo-localization', () => ({
  getLocales: () => [
    {
      languageCode: 'en',
      languageTag: 'en-US',
      regionCode: null,
      currencyCode: null,
      currencySymbol: null,
      decimalSeparator: null,
      digitGroupingSeparator: null,
      textDirection: null,
      measurementSystem: null,
      temperatureUnit: null,
    },
  ],
}))

// Mock datadog
vi.mock('@datadog/browser-logs', () => ({
  datadogLogs: {
    logger: {},
  },
}))

// Mock @react-native-community/netinfo
vi.mock('@react-native-community/netinfo', () => ({
  NetInfoStateType: {
    unknown: 'unknown',
    none: 'none',
    other: 'other',
    wifi: 'wifi',
    cellular: 'cellular',
    bluetooth: 'bluetooth',
    ethernet: 'ethernet',
    wimax: 'wimax',
    vpn: 'vpn',
  },
}))

// Mock chrome API (replacing jest-chrome functionality)
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    getManifest: vi.fn(() => ({ version: '1.0.0' })),
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  i18n: {
    getUILanguage: vi.fn(() => 'en-US'),
  },
}

// biome-ignore lint/suspicious/noExplicitAny: need to set chrome to the mock chrome object
;(global as any).chrome = mockChrome
