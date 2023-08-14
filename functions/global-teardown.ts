import { teardown } from 'jest-dev-server'

module.exports = async function globalTeardown() {
  await new Promise((resolve) => setTimeout(resolve, 5000))
  await teardown(globalThis.servers)
}
