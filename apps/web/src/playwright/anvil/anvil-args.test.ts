import { mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import * as path from 'path'
import { describe, expect, it } from 'vitest'
import {
  buildAnvilSpawnArgs,
  buildResetForkParams,
  isAnvilVerbose,
  resolveForkChainDefaults,
  resolveLoadStatePath,
  resolvePinnedForkBlock,
} from '~/playwright/anvil/anvil-args'

describe('resolvePinnedForkBlock', () => {
  it('returns the checked-in mainnet pin when no override is set', () => {
    expect(resolvePinnedForkBlock({ chainId: 1, env: {} })).toBe(25510000)
  })

  it('returns the checked-in base pin when no override is set', () => {
    expect(resolvePinnedForkBlock({ chainId: 8453, env: {} })).toBe(48510000)
  })

  it('honors the ANVIL_FORK_BLOCK override for mainnet', () => {
    expect(resolvePinnedForkBlock({ chainId: 1, env: { ANVIL_FORK_BLOCK: '12345678' } })).toBe(12345678)
  })

  it('honors the ANVIL_FORK_BLOCK_BASE override for base', () => {
    expect(resolvePinnedForkBlock({ chainId: 8453, env: { ANVIL_FORK_BLOCK_BASE: '87654321' } })).toBe(87654321)
  })

  it('ignores the base override when resolving mainnet', () => {
    expect(resolvePinnedForkBlock({ chainId: 1, env: { ANVIL_FORK_BLOCK_BASE: '87654321' } })).toBe(25510000)
  })

  it('falls back to the default for a blank override', () => {
    expect(resolvePinnedForkBlock({ chainId: 1, env: { ANVIL_FORK_BLOCK: '  ' } })).toBe(25510000)
  })

  it.each(['latest', '-5', '1.5', '0x123'])('rejects the malformed override %j', (value) => {
    expect(() => resolvePinnedForkBlock({ chainId: 1, env: { ANVIL_FORK_BLOCK: value } })).toThrow('ANVIL_FORK_BLOCK')
  })

  it('returns undefined (no pin) for chains without a pinned block', () => {
    expect(resolvePinnedForkBlock({ chainId: 137, env: {} })).toBeUndefined()
  })
})

describe('isAnvilVerbose', () => {
  it.each(['1', 'true', 'TRUE', 'True'])('is verbose for ANVIL_VERBOSE=%s', (value) => {
    expect(isAnvilVerbose({ ANVIL_VERBOSE: value })).toBe(true)
  })

  it.each(['0', 'false', '', undefined])('is quiet for ANVIL_VERBOSE=%s', (value) => {
    expect(isAnvilVerbose({ ANVIL_VERBOSE: value })).toBe(false)
  })
})

describe('buildAnvilSpawnArgs', () => {
  const forkSource = {
    forkUrl: 'https://gateway.example/rpc/1',
    forkHeaders: { 'X-Session-ID': 'session-1' },
  }

  it('pins the fork block and prunes history, with tracing off by default', () => {
    const args = buildAnvilSpawnArgs({
      forkSource,
      forkBlockNumber: 25510000,
      port: 8545,
      host: '127.0.0.1',
      verbose: false,
    })

    expect(args).toEqual([
      '--fork-url',
      'https://gateway.example/rpc/1',
      '--fork-header',
      'X-Session-ID: session-1',
      '--fork-block-number',
      '25510000',
      '--port',
      '8545',
      '--host',
      '127.0.0.1',
      '--hardfork',
      'prague',
      '--no-rate-limit',
      '--disable-code-size-limit',
      '--prune-history',
    ])
  })

  it('does not disable the min priority fee — that broke node-filled transactions', () => {
    // With --disable-min-priority-fee anvil's suggested gasPrice (~base fee) falls
    // below its own 1-gwei default priority-fee suggestion, so every fee-less
    // eth_sendTransaction is rejected with -32003.
    const args = buildAnvilSpawnArgs({
      forkSource,
      forkBlockNumber: 25510000,
      port: 8545,
      host: '127.0.0.1',
      verbose: false,
    })

    expect(args).not.toContain('--disable-min-priority-fee')
  })

  it('adds --print-traces only in verbose mode', () => {
    const quiet = buildAnvilSpawnArgs({ forkSource, forkBlockNumber: 1, port: 8545, host: '127.0.0.1', verbose: false })
    const verbose = buildAnvilSpawnArgs({
      forkSource,
      forkBlockNumber: 1,
      port: 8545,
      host: '127.0.0.1',
      verbose: true,
    })

    expect(quiet).not.toContain('--print-traces')
    expect(verbose).toContain('--print-traces')
  })

  it('omits --fork-block-number when no pin is resolved', () => {
    const args = buildAnvilSpawnArgs({
      forkSource,
      forkBlockNumber: undefined,
      port: 8545,
      host: '127.0.0.1',
      verbose: false,
    })

    expect(args).not.toContain('--fork-block-number')
  })

  it('adds --load-state when a state fixture path is resolved, omits it otherwise', () => {
    const base = { forkSource, forkBlockNumber: 25510000, port: 8545, host: '127.0.0.1', verbose: false }

    const withState = buildAnvilSpawnArgs({ ...base, loadStatePath: '/repo/state/mainnet-25510000.json' })
    const without = buildAnvilSpawnArgs({ ...base, loadStatePath: undefined })

    expect(withState).toContain('--load-state')
    expect(withState[withState.indexOf('--load-state') + 1]).toBe('/repo/state/mainnet-25510000.json')
    expect(without).not.toContain('--load-state')
  })
})

describe('resolveLoadStatePath', () => {
  const stateDir = mkdtempSync(path.join(tmpdir(), 'anvil-state-'))
  writeFileSync(path.join(stateDir, 'mainnet-25510000.json'), '{}')

  it('resolves the committed fixture matching chain + pinned block', () => {
    expect(resolveLoadStatePath({ chainId: 1, forkBlockNumber: 25510000, env: {}, stateDir })).toBe(
      path.join(stateDir, 'mainnet-25510000.json'),
    )
  })

  it('returns undefined when the pin has moved past the committed fixture (stale state must never load)', () => {
    expect(resolveLoadStatePath({ chainId: 1, forkBlockNumber: 25999999, env: {}, stateDir })).toBeUndefined()
  })

  it('returns undefined for unpinned chains and chains without a fixture name', () => {
    expect(resolveLoadStatePath({ chainId: 1, forkBlockNumber: undefined, env: {}, stateDir })).toBeUndefined()
    expect(resolveLoadStatePath({ chainId: 137, forkBlockNumber: 123, env: {}, stateDir })).toBeUndefined()
  })

  it('honors an explicit ANVIL_LOAD_STATE path override', () => {
    expect(
      resolveLoadStatePath({
        chainId: 1,
        forkBlockNumber: 25510000,
        env: { ANVIL_LOAD_STATE: '/tmp/custom.json' },
        stateDir,
      }),
    ).toBe('/tmp/custom.json')
  })

  it.each(['0', 'none', 'NONE'])('disables state loading for ANVIL_LOAD_STATE=%s', (value) => {
    expect(
      resolveLoadStatePath({ chainId: 1, forkBlockNumber: 25510000, env: { ANVIL_LOAD_STATE: value }, stateDir }),
    ).toBeUndefined()
  })
})

describe('resolveForkChainDefaults', () => {
  it('returns the PublicNode mainnet default and port when no override is set', () => {
    expect(resolveForkChainDefaults({ chainId: 1, env: {} })).toEqual({
      forkUrl: 'https://ethereum-rpc.publicnode.com',
      defaultPort: 8545,
    })
  })

  it('returns the PublicNode base default and port when no override is set', () => {
    expect(resolveForkChainDefaults({ chainId: 8453, env: {} })).toEqual({
      forkUrl: 'https://base-rpc.publicnode.com',
      defaultPort: 8546,
    })
  })

  it('honors the per-chain fork URL override env vars', () => {
    expect(resolveForkChainDefaults({ chainId: 1, env: { ANVIL_FORK_URL: 'https://mainnet.example' } }).forkUrl).toBe(
      'https://mainnet.example',
    )
    expect(
      resolveForkChainDefaults({ chainId: 8453, env: { ANVIL_FORK_URL_BASE: 'https://base.example' } }).forkUrl,
    ).toBe('https://base.example')
  })

  it('ignores the base override when resolving mainnet', () => {
    expect(resolveForkChainDefaults({ chainId: 1, env: { ANVIL_FORK_URL_BASE: 'https://base.example' } }).forkUrl).toBe(
      'https://ethereum-rpc.publicnode.com',
    )
  })

  it('throws for chains without checked-in fork defaults', () => {
    expect(() => resolveForkChainDefaults({ chainId: 137, env: {} })).toThrow('No anvil fork defaults')
  })
})

describe('buildResetForkParams', () => {
  it('pins the reset to the same upstream and block as the launch', () => {
    expect(buildResetForkParams({ forkUrl: 'https://gateway.example/rpc/1', forkBlockNumber: 25510000 })).toEqual({
      jsonRpcUrl: 'https://gateway.example/rpc/1',
      blockNumber: 25510000n,
    })
  })

  it('omits blockNumber for unpinned chains instead of pinning to a bogus block', () => {
    expect(buildResetForkParams({ forkUrl: 'https://gateway.example/rpc/137', forkBlockNumber: undefined })).toEqual({
      jsonRpcUrl: 'https://gateway.example/rpc/137',
    })
  })
})
