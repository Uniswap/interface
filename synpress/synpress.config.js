const log = require('debug')('synpress:config')
const path = require('path')
const { defineConfig } = require('cypress')
const synpressPath = path.join(process.cwd(), '../node_modules/@synthetixio/synpress')
const pluginsPath = `${synpressPath}/plugins/index`
const setupNodeEvents = require(pluginsPath)
// const fixturesFolder = `${synpressPath}/fixtures`;

module.exports = defineConfig({
  reporter: 'mochawesome',
  reporterOptions: {
    reportDir: 'target/results',
    reportFilename: '[status]_[datetime]-[name]-report',
    timestamp: 'longDate',
    overwrite: false,
    html: true,
    json: true,
  },
  userAgent: 'synpress',
  fixturesFolder: 'fixtures',
  screenshotsFolder: 'target/screenshots',
  videosFolder: 'target/videos',
  chromeWebSecurity: true,
  viewportWidth: 1920,
  viewportHeight: 1080,
  e2e: {
    baseUrl: 'https://kyberswap.com',
    specPattern: '**/*spec.js',
    supportFile: 'synpress/support/index.js',
    setupNodeEvents,
  },
})
