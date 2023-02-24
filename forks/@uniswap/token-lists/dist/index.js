
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./token-lists.cjs.production.min.js')
} else {
  module.exports = require('./token-lists.cjs.development.js')
}
