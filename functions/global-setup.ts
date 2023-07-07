import { setup } from 'jest-dev-server'

module.exports = async function globalSetup() {
  globalThis.servers = await setup({
    command: `yarn start:cloud`,
    port: 3000,
    launchTimeout: 50000,
  })
}
