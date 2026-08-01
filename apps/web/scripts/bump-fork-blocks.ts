// oxlint-disable eslint-js/no-restricted-syntax -- Node-side script: process.env is the config surface here
/**
 * Re-pins the anvil fork blocks (`fork-blocks.json`) near the current tip of each chain.
 *
 * For every pinned chain, asks the chain's static fork source (PublicNode by default —
 * same resolution as anvil-args.ts) for the latest block, backs off a small safety
 * margin (~15 minutes) so the pin is comfortably final, and rounds down to a whole
 * thousand so the CI RPC cache keys and fixture filenames stay tidy.
 *
 * Writes the new pins back to fork-blocks.json (preserving the $comment) and, inside
 * GitHub Actions, emits `<key>_old` / `<key>_new` / `changed` to $GITHUB_OUTPUT for the
 * bump workflow's PR table.
 *
 * When the pins moved, also drops the stale committed loadState fixture and bakes +
 * verifies a fresh one at the new mainnet pin (generateAnvilState) — the fixture
 * filename embeds the pin, so pins and fixture must always move together and this
 * script is the single entry point that does both.
 *
 *   bun scripts/bump-fork-blocks.ts
 */
import { appendFileSync, existsSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs'
import * as path from 'path'
import { resolveForkChainDefaults } from '~/playwright/anvil/anvil-args'
import { generateAnvilState } from './generate-anvil-state'

interface PinnedChain {
  /** Key in fork-blocks.json. */
  key: 'mainnet' | 'base'
  chainId: number
  /** Blocks subtracted from the tip before rounding down. */
  safetyMargin: number
}

// Margins target ~15 minutes behind tip: 75 blocks on mainnet (12s blocks),
// 450 blocks on base (2s blocks).
const PINNED_CHAINS: PinnedChain[] = [
  { key: 'mainnet', chainId: 1, safetyMargin: 75 },
  { key: 'base', chainId: 8453, safetyMargin: 450 },
]

/** Round down to a whole thousand: tidy pins in cache keys and fixture filenames. */
const PIN_GRANULARITY = 1000

const FORK_BLOCKS_PATH = path.join(__dirname, '..', 'src', 'playwright', 'anvil', 'fork-blocks.json')

async function latestBlockNumber(rpcUrl: string): Promise<number> {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_blockNumber', params: [] }),
  })
  if (!response.ok) {
    throw new Error(`eth_blockNumber against ${rpcUrl} failed: HTTP ${response.status}`)
  }
  const payload = (await response.json()) as { result?: string; error?: { message?: string } }
  if (typeof payload.result !== 'string') {
    throw new Error(`eth_blockNumber against ${rpcUrl} returned no result: ${JSON.stringify(payload.error ?? payload)}`)
  }
  return Number.parseInt(payload.result, 16)
}

function emitOutput(line: string): void {
  const outputPath = process.env.GITHUB_OUTPUT
  if (outputPath !== undefined && outputPath !== '') {
    appendFileSync(outputPath, `${line}\n`)
  }
}

async function main(): Promise<void> {
  const forkBlocks = JSON.parse(readFileSync(FORK_BLOCKS_PATH, 'utf8')) as Record<string, unknown>
  let changed = false

  for (const chain of PINNED_CHAINS) {
    const oldPin = forkBlocks[chain.key]
    if (typeof oldPin !== 'number') {
      throw new Error(`fork-blocks.json has no numeric "${chain.key}" pin`)
    }

    const { forkUrl } = resolveForkChainDefaults({ chainId: chain.chainId })
    const latest = await latestBlockNumber(forkUrl)
    const newPin = Math.floor((latest - chain.safetyMargin) / PIN_GRANULARITY) * PIN_GRANULARITY
    if (newPin < oldPin) {
      // Pins only move forward — a backwards tip means the RPC answered nonsense.
      throw new Error(`${chain.key}: computed pin ${newPin} is behind the current pin ${oldPin} (tip ${latest})`)
    }

    forkBlocks[chain.key] = newPin
    changed ||= newPin !== oldPin
    console.log(`${chain.key}: ${oldPin} -> ${newPin} (tip ${latest})`)
    emitOutput(`${chain.key}_old=${oldPin}`)
    emitOutput(`${chain.key}_new=${newPin}`)
  }

  emitOutput(`changed=${changed}`)
  writeFileSync(FORK_BLOCKS_PATH, `${JSON.stringify(forkBlocks, null, 2)}\n`)

  if (!changed) {
    return
  }

  // The fixture filename embeds the mainnet pin, so drop the stale fixture(s) and
  // bake a fresh one at the new pin. The pin is passed explicitly: anvil-args.ts
  // imports fork-blocks.json statically, so the file written above is not visible
  // through resolvePinnedForkBlock in this process.
  const stateDir = path.join(path.dirname(FORK_BLOCKS_PATH), 'state')
  for (const file of existsSync(stateDir) ? readdirSync(stateDir) : []) {
    if (file.endsWith('.json')) {
      unlinkSync(path.join(stateDir, file))
    }
  }
  const mainnetPin = forkBlocks.mainnet
  if (typeof mainnetPin !== 'number') {
    throw new Error('fork-blocks.json lost its numeric "mainnet" pin')
  }
  await generateAnvilState({ forkBlockNumber: mainnetPin })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
