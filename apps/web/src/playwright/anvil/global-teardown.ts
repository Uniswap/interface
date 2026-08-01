import { getAnvilManager } from '~/playwright/anvil/anvil-manager'
import { resolveConfiguredAnvilPort, terminateAnvilOnPort } from '~/playwright/anvil/anvil-process'

/**
 * Global teardown function for Playwright tests using Anvil.
 * Ensures Anvil is cleanly stopped after all tests complete.
 *
 * This runs in the Playwright runner process, but anvil is spawned inside worker
 * processes whose manager singletons (and child-process handles) are invisible here —
 * `getAnvilManager().stop()` alone left worker anvils running after every run. The
 * cross-process kill goes by the PID file each worker records (plus a port-based
 * mop-up for strays).
 */
// this is used in playwright.config.ts
export default async function globalTeardown() {
  console.log('Stopping Anvil after all tests...')
  await getAnvilManager().stop()
  await terminateAnvilOnPort(resolveConfiguredAnvilPort())
}
