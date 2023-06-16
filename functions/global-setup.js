const { setup: setupDevServer } = require('jest-dev-server')
const portReady = require('port-ready')

module.exports = async function globalSetup() {
  globalThis.servers = await setupDevServer({
    command: `NODE_OPTIONS=--dns-result-order=ipv4first npx wrangler pages dev --proxy=3001 --port=3000 -- yarn start`,
    launchTimeout: 60000,
    port: 3000,
  })
  await portReady({ port: 3000 })
}
