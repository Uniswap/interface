const storage = require('mem-storage-area')

global.chrome = {
  storage, // mem-storage-area is a reimplementation of chrome.storage in memory
} as typeof chrome
