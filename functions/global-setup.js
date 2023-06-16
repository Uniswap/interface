const { setup: setupDevServer } = require('jest-dev-server')
const portReady = require('port-ready')

module.exports = async function globalSetup() {
  globalThis.servers = await setupDevServer({
    command: `yarn start:wrangler`,
  })
  await new Promise((r) => setTimeout(r, 30000))
}
