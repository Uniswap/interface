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

global.__DEV__ = true
