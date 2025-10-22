// Setups and mocks can go here
// For example: https://reactnavigation.org/docs/testing/

import 'core-js' // necessary so setImmediate works in tests
import 'utilities/jest-package-mocks'
import 'uniswap/jest-package-mocks'
import 'wallet/jest-package-mocks'
import 'config/jest-presets/ui/ui-package-mocks'

import 'uniswap/src/i18n' // Uses real translations for tests

import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js'

jest.mock('@uniswap/client-explore/dist/uniswap/explore/v1/service-ExploreStatsService_connectquery', () => {})

jest.mock('@walletconnect/react-native-compat', () => ({}))

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
        }
      },
    }
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

  return RN
})

jest.mock('@react-navigation/elements', () => ({
  useHeaderHeight: jest.fn().mockImplementation(() => 200),
}))

require('react-native-reanimated').setUpTests()

jest.mock('react-native/Libraries/Share/Share', () => ({
  share: jest.fn(),
}))

jest.mock('@react-native-firebase/auth', () => () => ({
  signInAnonymously: jest.fn(),
}))

jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  canOpenURL: jest.fn(),
  getInitialURL: jest.fn(),
}))

jest.mock("react-native-bootsplash", () => {
  return {
    hide: jest.fn().mockResolvedValue(),
    isVisible: jest.fn().mockResolvedValue(false),
    useHideAnimation: jest.fn().mockReturnValue({
      container: {},
      logo: { source: 0 },
      brand: { source: 0 },
    }),
  };
});

jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest"),
);
