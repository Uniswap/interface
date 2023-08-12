import { setup } from 'jest-dev-server'

module.exports = async function globalSetup() {
  globalThis.servers = await setup({
    command: `yarn start:cloud`,
    port: 3000,
    launchTimeout: 80000,
  })
  // Wait for wrangler to return a request before running tests
  for (let i = 0; i < 3; i++) {
    const res = await fetch(new Request('http://127.0.0.1:3000/tokens/ethereum/NATIVE'))
    if (res.ok) {
      return
    }
    // Set timeout to make sure the server isn't flooded with requests if wrangler is not running
    await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)))
  }
  throw new Error('Failed to start server')
}
