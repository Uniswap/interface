// Sets up global.chrome in jest environment
//
const storage = require('mem-storage-area')
const mockRNCNetInfo = require('@react-native-community/netinfo/jest/netinfo-mock.js')

global.chrome = {
    storage: {
    ...storage, // mem-storage-area is a reimplementation of chrome.storage in memory
    session: {
      set: jest.fn(),
      get: jest.fn()
    }
  },
  runtime: {
    getURL: (path) => `chrome/path/to/${path}`
  }
}

jest.mock('react-native-appsflyer', () => {
  return {
    initSdk: jest.fn(),
  }
})

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

jest.mock('statsig-react-native', () => {
  const StatsigMock = {
    useGate: () => {
      return {
        isLoading: false,
        value: false,
      }
    },
    useConfig: () => {
      return {}
    },

    Statsig: {
      checkGate: () => false,
      getConfig: () => {
        return {
          get: (_name, fallback) => fallback,
          getValue: (_name, fallback) => fallback,
        }
      },
    },
  }
  return StatsigMock
})


global.__DEV__ = true
