// From https://reactnavigation.org/docs/testing/#setting-up-jest
import 'react-native-gesture-handler/jestSetup'
// Other
import 'core-js' // necessary so setImmediate works in tests
import '@universe/environment/jest-package-mocks'
import 'utilities/jest-package-mocks'
import 'uniswap/jest-package-mocks'
import 'wallet/jest-package-mocks'
import 'config/jest-presets/ui/ui-package-mocks'
import 'uniswap/src/i18n' // Uses real translations for tests
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js'

// RNGH v3 GestureDetectors throw without a GestureHandlerRootView ancestor; tests render
// without one. No-op the dev-only check so gestures mount without polluting snapshots.
// Both src and lib paths are mocked since either may resolve (mirrors RNGH's own jestSetup).
jest.mock('react-native-gesture-handler/src/v3/detectors/useEnsureGestureHandlerRootView', () => ({
  useEnsureGestureHandlerRootView: () => undefined,
}))
jest.mock('react-native-gesture-handler/lib/module/v3/detectors/useEnsureGestureHandlerRootView', () => ({
  useEnsureGestureHandlerRootView: () => undefined,
}))

// react-native-reanimated 4 imports react-native-worklets which tries to bind to
// a native module at import time. Mock worklets with the package's official jest
// mock before reanimated loads. Must come before the reanimated import below.
jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'))

const { setUpTests } = require('react-native-reanimated')

setUpTests()

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedModule')

jest.mock('@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery', () => {})

jest.mock('@walletconnect/react-native-compat', () => ({}))

// Mock NativeEventEmitter to delegate to RCTDeviceEventEmitter so that subscriptions
// returned from `addListener` have a working `.remove()`. RN 0.81 removed the
// __mocks__/NativeEventEmitter.js shim that previously did this, so addListener
// now returns undefined under jest auto-mocking.
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter', () => {
  const RCTDeviceEventEmitter =
    require('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter').default ||
    require('react-native/Libraries/EventEmitter/RCTDeviceEventEmitter')
  class NativeEventEmitter {
    addListener(eventType, listener, context) {
      return RCTDeviceEventEmitter.addListener(eventType, listener, context)
    }
    emit(eventType, ...args) {
      RCTDeviceEventEmitter.emit(eventType, ...args)
    }
    removeAllListeners(eventType) {
      RCTDeviceEventEmitter.removeAllListeners(eventType)
    }
    listenerCount(eventType) {
      return RCTDeviceEventEmitter.listenerCount(eventType)
    }
  }
  return { __esModule: true, default: NativeEventEmitter }
})

// Mock react-native-mmkv to avoid loading native nitro-modules in tests.
// Mirrors the createMockMMKV behavior from the library.
jest.mock('react-native-mmkv', () => {
  const createMMKV = (config = { id: 'mmkv.default' }) => {
    const storage = new Map()
    return {
      id: config.id,
      get size() {
        return storage.size
      },
      isReadOnly: false,
      clearAll: () => storage.clear(),
      remove: (key) => storage.delete(key),
      set: (key, value) => {
        storage.set(key, value)
      },
      getString: (key) => storage.get(key),
      getNumber: (key) => storage.get(key),
      getBoolean: (key) => storage.get(key),
      getBuffer: (key) => storage.get(key),
      contains: (key) => storage.has(key),
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
jest.mock('react-native-onesignal', () => {
  return {
    OneSignal: {
      Debug: {
        setLogLevel: jest.fn(),
      },
      initialize: jest.fn(),
      Notifications: {
        addEventListener: jest.fn(),
        requestPermission: jest.fn(),
      },
      User: {
        addTag: jest.fn(),
        addTags: jest.fn(),
        getOnesignalId: jest.fn(() => 'dummyUserId'),
        pushSubscription: {
          getTokenAsync: jest.fn(() => 'dummyPushToken'),
        },
      },
    },
  }
})

jest.mock('react-native-appsflyer', () => {
  return {
    initSdk: jest.fn(),
  }
})

jest.mock('react-native-permissions', () => ({}))

// NetInfo mock does not export typescript types
const NetInfoStateType = {
  unknown: 'unknown',
  none: 'none',
  cellular: 'cellular',
  wifi: 'wifi',
  bluetooth: 'bluetooth',
  ethernet: 'ethernet',
  wimax: 'wimax',
  vpn: 'vpn',
  other: 'other',
}
jest.mock('@react-native-community/netinfo', () => ({ ...mockRNCNetInfo, NetInfoStateType }))

// from https://github.com/facebook/react-native/issues/28839#issuecomment-625453688
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native') // use original implementation, which comes with mocks out of the box

  // Mock Linking module within React Native
  RN.Linking = {
    openURL: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    canOpenURL: jest.fn(),
    getInitialURL: jest.fn(),
  }

  // Mock Share module within React Native
  RN.Share = {
    share: jest.fn(),
    sharedAction: 'sharedAction',
    dismissedAction: 'dismissedAction',
  }

  return RN
})

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn().mockImplementation(() => 200),
}))

jest.mock('@react-native-firebase/auth', () => () => ({
  signInAnonymously: jest.fn(),
}))

jest.mock('react-native-bootsplash', () => {
  return {
    hide: jest.fn().mockResolvedValue(),
    isVisible: jest.fn().mockResolvedValue(false),
    useHideAnimation: jest.fn().mockReturnValue({
      container: {},
      logo: { source: 0 },
      brand: { source: 0 },
    }),
  }
})

jest.mock('react-native-keyboard-controller', () => require('react-native-keyboard-controller/jest'))

// Mock @gorhom/bottom-sheet with plain View components
jest.mock('@gorhom/bottom-sheet', () => {
  const reactNative = jest.requireActual('react-native')
  const { View } = reactNative
  return {
    __esModule: true,
    default: View,
    BottomSheetModal: View,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
  }
})
