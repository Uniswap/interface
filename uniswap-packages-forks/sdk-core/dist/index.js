
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./sdk-core.cjs.production.min.js')
} else {
  module.exports = require('./sdk-core.cjs.development.js')
}
