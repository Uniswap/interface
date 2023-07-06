import { setup } from 'jest-dev-server'

module.exports = async function globalSetup() {
  globalThis.servers = await setup({
    command: `yarn start:wrangler`,
    port: 3000,
  })
}
