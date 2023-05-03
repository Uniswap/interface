// Sets up global.chrome in jest environment
//
const storage = require('mem-storage-area')

global.chrome = {
  storage, // mem-storage-area is a reimplementation of chrome.storage in memory
  runtime: {
    getUrl: (path) => `chrome/path/to/${path}`
  }
}
