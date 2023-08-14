import { teardown } from 'jest-dev-server'

module.exports = async function globalTeardown() {
  await teardown(globalThis.servers)
}
