import { vi } from 'vitest'

// Mock IntersectionObserver which is not available in jsdom
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  constructor(
    private callback: IntersectionObserverCallback,
    private options?: IntersectionObserverInit,
  ) {}

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
  takeRecords(): IntersectionObserverEntry[] {
    return []
  }
}
global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver

// Mock @testing-library/react-native to use @testing-library/react in jsdom environment
// This is necessary because @testing-library/react-native requires React Native runtime
vi.mock('@testing-library/react-native', async () => {
  const rtl = await import('@testing-library/react')

  // Create fireEvent as a function that also has methods (React Native style)
  // React Native Testing Library supports: fireEvent(element, eventName, data)
  // biome-ignore lint/suspicious/noExplicitAny: matching React Native Testing Library's fireEvent signature
  const fireEventBase = (element: Element, eventName: string, data?: any): boolean => {
    // Handle common React Native event names
    const eventMap: Record<string, string> = {
      press: 'click',
      onPress: 'click',
      longPress: 'contextmenu',
      contextMenu: 'contextmenu',
      onMouseDown: 'mousedown',
      mouseDown: 'mousedown',
    }
    const webEventName = eventMap[eventName] || eventName
    // biome-ignore lint/suspicious/noExplicitAny: matching React Native Testing Library's fireEvent signature
    const fireEventFn = (rtl.fireEvent as any)[webEventName] || rtl.fireEvent
    return fireEventFn(element, data)
  }

  // Create fireEvent with both function call and method access
  const fireEvent = Object.assign(fireEventBase, {
    ...rtl.fireEvent,
    // Map press to click for web
    press: (element: Element, options?: object) => rtl.fireEvent.click(element, options),
    changeText: (element: Element, text: string) => rtl.fireEvent.change(element, { target: { value: text } }),
  })

  // Wrap render to add toJSON method for React Native Testing Library compatibility
  // React Native Testing Library's toJSON() returns ReactTestRendererJSON from react-test-renderer
  // Web's asFragment() returns DocumentFragment - both work with vitest snapshot serializers
  // biome-ignore lint/suspicious/noExplicitAny: wrapping RTL render requires flexible types
  const render = (...args: any[]) => {
    const result = rtl.render(...args)
    return {
      ...result,
      // Map toJSON to asFragment for snapshot compatibility
      toJSON: () => result.asFragment(),
    }
  }

  return {
    ...rtl,
    render,
    fireEvent,
    // React Native specific exports that need mapping
    cleanup: rtl.cleanup,
    cleanupAsync: async () => rtl.cleanup(),
  }
})

// Mock @testing-library/jest-native which requires React Native runtime
// This provides custom matchers for React Native that aren't needed in jsdom
vi.mock('@testing-library/jest-native', () => ({}))

// Mock expo-secure-store before any imports that might use it
vi.mock('expo-secure-store', () => ({
  getItemAsync: vi.fn(() => Promise.resolve(null)),
  setItemAsync: vi.fn(() => Promise.resolve()),
  deleteItemAsync: vi.fn(() => Promise.resolve()),
}))

// Import shared mocks using relative paths
import '../../config/vitest-presets/vitest/setup.js'
import '../utilities/vitest-package-mocks'
import './vitest-package-mocks'

// Import from ui vitest-setup for React Native component mocks
import '../ui/vitest-setup'

// Mock i18n to avoid require() path resolution issues
// The original jest setup imported 'uniswap/src/i18n' but that uses require() internally
// Common translations map for test assertions that look for translated text
const commonTranslations: Record<string, string> = {
  'common.button.retry': 'Retry',
  'common.error.title': 'Oops! Something went wrong.',
  'common.card.error.title': 'Oops! Something went wrong.',
  'common.card.error.description': 'Something went wrong.',
  'common.button.learn': 'Learn more',
  'common.text.learnMore': 'Learn more',
  'unitags.claim.error.unavailable': 'Username unavailable',
  'common.today': 'Today',
  'common.yesterday': 'Yesterday',
  // Storage settings translations
  'settings.setting.storage.clearAccountHistory.title': 'Clear account history',
  'settings.setting.storage.clearAccountHistory.subtitle': 'Clear your account history',
  'settings.setting.storage.clearUserSettings.title': 'Clear preferences',
  'settings.setting.storage.clearUserSettings.subtitle': 'Clear your preferences',
  'settings.setting.storage.clearCachedData.title': 'Clear cache',
  'settings.setting.storage.clearCachedData.subtitle': 'Clear cached data',
  'settings.setting.storage.clearAllData.title': 'Clear all data',
  'settings.setting.storage.clearAllData.subtitle': 'Clear all local data',
  'settings.setting.storage.confirm.approve': 'Clear data',
  'settings.setting.storage.confirm.caption': 'Are you sure you want to clear this data?',
  'settings.setting.storage.success': 'Data cleared successfully',
  'settings.setting.storage.error': 'Failed to clear data',
}

const mockT = (key: string, options?: Record<string, unknown>) => {
  // Return common translations if available, otherwise return key
  if (key in commonTranslations) {
    return commonTranslations[key]
  }
  // Handle interpolation for keys with values
  if (options && typeof options === 'object') {
    let result = key
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v))
    })
    return result
  }
  return key
}

// Mock react-i18next to provide translations for tests
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn(),
      resolvedLanguage: 'en',
    },
  }),
  Trans: ({ children }: { children?: React.ReactNode }) => children,
  initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

vi.mock('uniswap/src/i18n', () => ({
  changeLanguage: vi.fn(),
  default: {
    t: (key: string, options?: Record<string, unknown>) => {
      // Return common translations if available, otherwise return key
      if (key in commonTranslations) {
        return commonTranslations[key]
      }
      // Handle interpolation for keys with values
      if (options && typeof options === 'object') {
        let result = key
        Object.entries(options).forEach(([k, v]) => {
          result = result.replace(`{{${k}}}`, String(v))
        })
        return result
      }
      return key
    },
    exists: () => true,
    language: 'en',
    languages: ['en'],
    resolvedLanguage: 'en',
    changeLanguage: vi.fn(),
    use: vi.fn().mockReturnThis(),
    init: vi.fn().mockReturnThis(),
    on: vi.fn(),
    off: vi.fn(),
  },
}))

vi.mock('uniswap/src/i18n/i18n-setup', () => ({}))

vi.mock(
  'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore',
  () => {
    return {
      useTransactionSettingsStore: (
        selector: (state: { customDeadline: number; customSlippageTolerance: number }) => unknown,
      ) =>
        selector({
          customDeadline: 20,
          customSlippageTolerance: 0.5,
        }),
    }
  },
)

// Mock Modal component - provide simple implementations for tests
vi.mock('uniswap/src/components/modals/Modal', () => {
  const React = require('react')
  return {
    Modal: ({ children, isModalOpen = true }: { children?: React.ReactNode; isModalOpen?: boolean }) => {
      if (!isModalOpen) {
        return null
      }
      return React.createElement('div', { 'data-testid': 'modal' }, children)
    },
    BottomSheetDetachedModal: ({ children }: { children?: React.ReactNode }) => {
      return React.createElement('div', { 'data-testid': 'bottom-sheet-detached-modal' }, children)
    },
    BottomSheetTextInput: (props: Record<string, unknown>) => {
      return React.createElement('input', props)
    },
  }
})

// Mock the browser's performance API
global.performance = require('perf_hooks').performance

// Mock calculateElapsedTimeWithPerformanceMarkMs with web implementation
vi.mock('utilities/src/telemetry/trace/utils/calculateElapsedTimeWithPerformanceMarkMs', () => ({
  calculateElapsedTimeWithPerformanceMarkMs: (markName: string, fallbackStartTime?: number): number | undefined => {
    const elapsedTime = performance.mark(markName)
    if (elapsedTime) {
      return elapsedTime.startTime
    }
    if (fallbackStartTime) {
      return Date.now() - fallbackStartTime
    }
    return undefined
  },
}))

// Mock OverKeyboardContent with web implementation
vi.mock('ui/src/components/OverKeyboardContent/OverKeyboardContent', () => {
  const React = require('react')
  return {
    OverKeyboardContent: ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) => {
      return visible ? React.createElement(React.Fragment, null, children) : null
    },
  }
})
