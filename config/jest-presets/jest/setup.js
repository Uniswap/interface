// Sets up global.chrome in jest environment
//
const storage = require('mem-storage-area')

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
