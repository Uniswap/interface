import { getAnvilManager } from 'playwright/anvil/anvil-manager'

/**
 * Global teardown function for Playwright tests using Anvil.
 * Ensures Anvil is cleanly stopped after all tests complete.
 */
// this is used in playwright.config.ts
// eslint-disable-next-line import/no-unused-modules
export default async function globalTeardown() {
  console.log('Stopping Anvil after all tests...')
  await getAnvilManager().stop()
}
