// oxlint-disable eslint-js/no-restricted-syntax -- Node-side script: process.env is the config surface here
/**
 * Prints the full anvil argv for a chain's e2e fork, one arg per line.
 *
 * This is how scripts/start-anvil.sh consumes `buildAnvilSpawnArgs()` — the single
 * source of truth for anvil flags (playwright/anvil/anvil-args.ts), so the shell
 * flow can never drift from what the Playwright anvil manager spawns.
 *
 * Resolves the same knobs the manager does:
 * - fork source: PublicNode default / ANVIL_FORK_URL(_BASE) override, or the uni RPC
 *   entry gateway with session fork-headers when ANVIL_FORK_VIA_UNIRPC=1 (bootstraps
 *   or reuses the session persisted at ~/.uniswap/session.json; gateway override via
 *   ANVIL_UNIRPC_GATEWAY_URL)
 * - pinned fork block: fork-blocks.json / ANVIL_FORK_BLOCK(_BASE) override
 * - verbosity: ANVIL_VERBOSE (start-anvil.sh defaults it on for the local flow)
 *
 * Usage: bun scripts/anvil-spawn-args.ts <chainId>
 */
import {
  buildAnvilSpawnArgs,
  isAnvilVerbose,
  resolveForkChainDefaults,
  resolveLoadStatePath,
  resolvePinnedForkBlock,
} from '~/playwright/anvil/anvil-args'
import { resolveForkSourceProvider } from '~/playwright/anvil/unirpc-fork'

async function main(): Promise<void> {
  const chainIdArg = process.argv[2] ?? '1'
  const chainId = Number.parseInt(chainIdArg, 10)
  if (!Number.isInteger(chainId) || chainId <= 0) {
    console.error(`Invalid chainId: ${chainIdArg}`)
    process.exit(1)
  }

  const chainDefaults = resolveForkChainDefaults({ chainId })
  const provider = resolveForkSourceProvider({ defaultForkUrl: chainDefaults.forkUrl, chainId })
  const forkSource = await provider.getForkSource()

  const forkBlockNumber = resolvePinnedForkBlock({ chainId })
  const args = buildAnvilSpawnArgs({
    forkSource,
    forkBlockNumber,
    loadStatePath: resolveLoadStatePath({ chainId, forkBlockNumber }),
    port: chainDefaults.defaultPort,
    host: '127.0.0.1',
    verbose: isAnvilVerbose(),
  })

  // One arg per line — start-anvil.sh reads these into the anvil argv.
  process.stdout.write(`${args.join('\n')}\n`)
}

main().catch((error) => {
  console.error('Failed to resolve anvil spawn args:', error)
  process.exit(1)
})
