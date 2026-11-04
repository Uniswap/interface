import { resolveForkChainDefaults } from '~/playwright/anvil/anvil-args'
import { getAllAnvilManagers } from '~/playwright/anvil/anvil-manager'
import { hasAnvilPidFile, resolveConfiguredAnvilPort, terminateAnvilOnPort } from '~/playwright/anvil/anvil-process'

const BNB_CHAIN_ID = 56

/**
 * Global teardown function for Playwright tests using Anvil.
 * Ensures Anvil is cleanly stopped after all tests complete.
 *
 * This runs in the Playwright runner process, but anvil is spawned inside worker
 * processes whose manager singletons (and child-process handles) are invisible here —
 * stopping this process's managers alone left worker anvils running after every run. The
 * cross-process kill goes by the PID file each worker records (plus a port-based
 * mop-up for strays).
 */
// this is used in playwright.config.ts
export default async function globalTeardown() {
  console.log('Stopping Anvil after all tests...')
  await Promise.all(getAllAnvilManagers().map((manager) => manager.stop()))
  await terminateAnvilOnPort(resolveConfiguredAnvilPort())
  // The BNB fork only exists when a spec asked for `bnbAnvil`. Kill it only when a worker recorded
  // spawning it, so a developer's own `bun web anvil:bnb` on the same port survives the run.
  const bnbPort = resolveForkChainDefaults({ chainId: BNB_CHAIN_ID }).defaultPort
  if (hasAnvilPidFile(bnbPort)) {
    await terminateAnvilOnPort(bnbPort)
  }
}
